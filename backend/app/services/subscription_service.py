import logging
from asyncpg import Connection
from datetime import datetime, timezone, timedelta

from app.schemas.revenuecat import RevenueCatEventRequest
from app.schemas.subscription_bonus import WeeklyBonusClaimResponse
from app.schemas.coin import CoinLedgerReason
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.coin_service import CoinService
from app.core.config import settings
from app.core.errors import NotFoundError, ConflictError

logger = logging.getLogger(__name__)

class SubscriptionService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = SubscriptionRepository(conn)

    def _ms_to_datetime(self, ms: int) -> datetime:
        return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc)

    async def handle_webhook(self, payload: RevenueCatEventRequest):
        event = payload.event
        event_id = event.id

        # Claiming the event ID and applying its effects share one transaction: if
        # anything fails the claim is rolled back too, so RevenueCat's retry is
        # processed rather than skipped as an already-seen event.
        async with self.conn.transaction():
            if await self.repo.event_already_processed(event_id):
                logger.info(f"RevenueCat event {event_id} already processed. Skipping.")
                return {"status": "already_processed"}

            processing_result = await self._apply_event(payload)

            await self.repo.update_event_metadata(
                event_id=event_id,
                event_type=event.type,
                app_user_id=event.app_user_id,
                environment=event.environment.lower() if event.environment else None,
                product_id=event.product_id,
                processing_result=processing_result
            )
            return {"status": processing_result}

    async def _apply_event(self, payload: RevenueCatEventRequest) -> str:
        """Apply the event's effects and return the processing result label."""
        event = payload.event
        event_id = event.id
        event_type = event.type
        app_user_id = event.app_user_id
        env = event.environment.lower() if event.environment else None

        if event_type == 'TEST':
            logger.info(f"RevenueCat TEST event {event_id} acknowledged.")
            return "processed"

        # Validate that app_user_id is a valid UUID matching our auth.users
        try:
            user_id = await self.repo.get_user_id_by_uuid(app_user_id)
        except ValueError:
            logger.warning(f"RevenueCat event {event_id} has invalid UUID format for app_user_id: {app_user_id}. Ignoring safely.")
            return "ignored_invalid_user_id"
        if not user_id:
            logger.warning(f"RevenueCat event {event_id} mapped to unknown user {app_user_id}. Ignoring safely.")
            return "ignored_unknown_user"

        db_env = 'sandbox' if env == 'sandbox' else 'production'

        expires_at = self._ms_to_datetime(event.expiration_at_ms) if event.expiration_at_ms else None

        # We process the first entitlement if available, though typically rivals_plus
        entitlement_id = event.entitlement_ids[0] if event.entitlement_ids else 'rivals_plus'

        if event_type in ('INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'CANCELLATION'):
            will_renew = event_type != 'CANCELLATION'
            purchased_at = self._ms_to_datetime(event.purchased_at_ms)
            await self.repo.upsert_subscription(
                user_id=user_id,
                product_id=event.product_id,
                entitlement_id=entitlement_id,
                status='active',
                environment=db_env,
                purchased_at=purchased_at,
                expires_at=expires_at,
                will_renew=will_renew,
                store_transaction_id=event.transaction_id,
                revenuecat_app_user_id=app_user_id
            )
            logger.info(f"Upserted active subscription for user {user_id} (will_renew={will_renew})")

        elif event_type == 'EXPIRATION':
            await self.repo.update_subscription_status(
                user_id=user_id,
                entitlement_id=entitlement_id,
                status='expired',
                will_renew=False
            )
            logger.info(f"Marked subscription as expired for user {user_id}")

        elif event_type == 'BILLING_ISSUE':
            await self.repo.update_subscription_status(
                user_id=user_id,
                entitlement_id=entitlement_id,
                status='past_due',
                will_renew=True
            )
            logger.info(f"Marked subscription as past_due for user {user_id}")

        else:
            logger.info(f"RevenueCat event {event_type} ignored for user {user_id}")
            return "ignored_unsupported_event"

        return "processed"

    def _get_current_weekly_period(self):
        # Weekly period: Monday 00:00:00 UTC through Sunday 23:59:59 UTC
        now = datetime.now(timezone.utc)
        # weekday() returns 0 for Monday, 6 for Sunday
        days_since_monday = now.weekday()
        monday_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        sunday_end = monday_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        return monday_start, sunday_end

    async def claim_weekly_bonus(self, user_id: str) -> WeeklyBonusClaimResponse:
        sub = await self.repo.get_active_subscription(user_id, 'rivals_plus')
        
        expired = bool(sub and sub['expires_at'] and sub['expires_at'] <= datetime.now(timezone.utc))
        if not sub or sub['status'] != 'active' or expired:
            # Sub is either missing, expired, past_due, etc.
            # We return early. Wait, if it's inactive, we should raise an error or return a specific response.
            # The user asked for "Not eligible: appropriate HTTP status". We can raise an error or just return.
            raise ConflictError("Active Rivalss+ subscription required to claim weekly bonus")

        period_start, period_end = self._get_current_weekly_period()
        coins_awarded = settings.WEEKLY_BONUS_COINS
        
        coin_service = CoinService(self.conn)

        async with self.conn.transaction():
            claim_id = await self.repo.insert_weekly_claim(user_id, period_start, period_end, coins_awarded)
            
            if not claim_id:
                # Already claimed this period
                current_balance = await coin_service.get_balance(user_id)
                return WeeklyBonusClaimResponse(
                    claimed=False,
                    already_claimed=True,
                    coins_awarded=0,
                    balance=current_balance,
                    period_start=period_start,
                    period_end=period_end
                )

            # Insert succeeded, award coins
            ledger_entry = await coin_service.add_coins(
                user_id=user_id,
                amount=coins_awarded,
                reason=CoinLedgerReason.weekly_bonus,
                reference_table='rivals_plus_weekly_claims'
            )
            
            return WeeklyBonusClaimResponse(
                claimed=True,
                already_claimed=False,
                coins_awarded=coins_awarded,
                balance=ledger_entry.balance_after,
                period_start=period_start,
                period_end=period_end
            )
