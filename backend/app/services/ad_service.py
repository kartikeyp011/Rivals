import httpx
import base64
import logging
from ecdsa import VerifyingKey, BadSignatureError
from ecdsa.util import sigdecode_der
import hashlib
from typing import Optional, Dict, Tuple
from uuid import UUID
import time
from asyncpg import Connection

from app.schemas.ad import AdIntentCreate, AdIntentResponse
from app.repositories.ad_repository import AdRepository
from app.services.coin_service import CoinService
from app.schemas.coin import CoinLedgerReason
from app.core.errors import NotFoundError, ConflictError

logger = logging.getLogger(__name__)

# Cache for AdMob public keys: key_id -> (pem, expiry_timestamp)
_admob_keys_cache: Dict[str, Tuple[str, float]] = {}
_CACHE_TTL = 86400  # 24 hours

async def _fetch_admob_keys():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://gstatic.com/admob/reward/verifier-keys.json")
            if resp.status_code == 200:
                data = resp.json()
                now = time.time()
                for key_data in data.get('keys', []):
                    kid = str(key_data.get('keyId'))
                    _admob_keys_cache[kid] = (key_data.get('pem'), now + _CACHE_TTL)
    except Exception as e:
        logger.error(f"Failed to fetch AdMob keys: {e}")

async def get_admob_public_key(key_id: str) -> Optional[str]:
    now = time.time()
    if key_id in _admob_keys_cache:
        pem, expiry = _admob_keys_cache[key_id]
        if now < expiry:
            return pem

    # If not found or expired, refresh keys
    await _fetch_admob_keys()

    if key_id in _admob_keys_cache:
        pem, expiry = _admob_keys_cache[key_id]
        if now < expiry:
            return pem

    return None

class AdService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.ad_repo = AdRepository(conn)
        self.coin_service = CoinService(conn)

    async def create_intent(self, user_id: str, data: AdIntentCreate) -> AdIntentResponse:
        return await self.ad_repo.create_intent(user_id, data.action)

    async def verify_signature(self, query_string: str, signature: str, key_id: str) -> bool:
        pem_key = await get_admob_public_key(key_id)
        if not pem_key:
            logger.error(f"AdMob public key not found for key_id: {key_id}")
            return False

        try:
            vk = VerifyingKey.from_pem(pem_key)
            # AdMob uses base64 url safe encoding for the signature
            # Pad it if necessary
            sig_bytes = base64.urlsafe_b64decode(signature + '=' * (-len(signature) % 4))

            # The query_string passed here should be the exact query string up to &signature=
            message = query_string.encode('utf-8')

            return vk.verify(sig_bytes, message, hashfunc=hashlib.sha256, sigdecode=sigdecode_der)
        except BadSignatureError:
            logger.error("AdMob SSV signature verification failed")
            return False
        except Exception as e:
            logger.error(f"Error during AdMob SSV verification: {e}")
            return False

    async def process_ssv_webhook(self, query_string: str, custom_data: str, signature: str, key_id: str, event_id: str, reward_amount: int, reward_item: str):
        # 1. Verify Signature
        # Note: In development/local, we might skip signature validation if testing,
        # but for production it's mandatory.
        import os
        is_local = os.getenv("ENVIRONMENT") == "local"
        if not is_local:
            is_valid = await self.verify_signature(query_string, signature, key_id)
            if not is_valid:
                raise ConflictError("Invalid SSV signature")

        # 2. Parse custom_data as intent_id
        try:
            intent_id = UUID(custom_data)
        except ValueError:
            logger.error(f"Invalid custom_data (intent_id) received: {custom_data}")
            return # Ignore safely

        async with self.conn.transaction():
            # 3. Idempotency Check
            inserted = await self.ad_repo.record_ssv_event(event_id, intent_id, reward_amount, reward_item, key_id)
            if not inserted:
                logger.info(f"AdMob SSV event {event_id} already processed. Skipping.")
                return

            # 4. Fetch intent
            intent = await self.ad_repo.get_intent(intent_id)
            if not intent:
                logger.error(f"Intent {intent_id} not found for SSV event {event_id}")
                return

            if intent['status'] != 'pending':
                logger.info(f"Intent {intent_id} is already {intent['status']}")
                return

            # Expiration check
            if intent.get('expires_at') and intent['expires_at'].timestamp() < time.time():
                logger.info(f"Intent {intent_id} has expired.")
                # We can still mark it failed/expired, but at minimum we stop processing
                return

            # 5. Mark completed
            await self.ad_repo.mark_intent_completed(intent_id)

            # 6. If action is 'claim_reward', immediately fulfill it
            if intent['action'] == 'claim_reward':
                # Mark used and award coins
                await self.ad_repo.consume_intent(intent_id, str(intent['user_id']), 'claim_reward')
                await self.coin_service.add_coins(
                    user_id=str(intent['user_id']),
                    amount=60, # Strictly 60 coins
                    reason=CoinLedgerReason.rewarded_ad,
                    reference_id=intent_id,
                    reference_table='ad_intents'
                )

    async def consume_intent(self, intent_id: UUID, user_id: str, expected_action: str):
        # Called by arenas.py and wagers.py to ensure the ad was completed
        success = await self.ad_repo.consume_intent(intent_id, user_id, expected_action)
        if not success:
            raise ConflictError(f"Valid completed ad intent for {expected_action} not found")
