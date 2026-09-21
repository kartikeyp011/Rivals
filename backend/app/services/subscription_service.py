import logging
from asyncpg import Connection
from datetime import datetime, timezone

from app.schemas.revenuecat import RevenueCatEventRequest
from app.repositories.subscription_repository import SubscriptionRepository
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
        
        # 1. Idempotency Check
        is_processed = await self.repo.event_already_processed(event_id)
        if is_processed:
            logger.info(f"RevenueCat event {event_id} already processed. Skipping.")
            return {"status": "already_processed"}
            
        event_type = event.type
        if event_type == 'TEST':
            logger.info(f"RevenueCat TEST event {event_id} acknowledged.")
            return {"status": "processed"}
            
        app_user_id = event.app_user_id
        
        # Try to validate that app_user_id is a valid UUID matching our auth.users
        try:
            user_id = await self.repo.get_user_id_by_uuid(app_user_id)
            if not user_id:
                logger.warning(f"RevenueCat event {event_id} mapped to unknown user {app_user_id}. Ignoring safely.")
                return {"status": "ignored_unknown_user"}
        except ValueError:
            # Not a valid UUID
            logger.warning(f"RevenueCat event {event_id} has invalid UUID format for app_user_id: {app_user_id}. Ignoring safely.")
            return {"status": "ignored_invalid_user_id"}

        env = 'sandbox' if event.environment.lower() == 'sandbox' else 'production'
        
        purchased_at = self._ms_to_datetime(event.purchased_at_ms)
        expires_at = self._ms_to_datetime(event.expiration_at_ms) if event.expiration_at_ms else None
        
        # We process the first entitlement if available, though typically rivals_plus
        entitlement_id = event.entitlement_ids[0] if event.entitlement_ids else 'rivals_plus'

        if event_type in ('INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'):
            will_renew = True if event_type != 'CANCELLATION' else False
            if event_type == 'UNCANCELLATION':
                will_renew = True
            
            await self.repo.upsert_subscription(
                user_id=user_id,
                product_id=event.product_id,
                entitlement_id=entitlement_id,
                status='active',
                environment=env,
                purchased_at=purchased_at,
                expires_at=expires_at,
                will_renew=will_renew,
                store_transaction_id=event.transaction_id,
                revenuecat_app_user_id=app_user_id
            )
            logger.info(f"Upserted active subscription for user {user_id}")
            
        elif event_type == 'CANCELLATION':
            # User canceled auto-renew, but is still active until expires_at
            await self.repo.upsert_subscription(
                user_id=user_id,
                product_id=event.product_id,
                entitlement_id=entitlement_id,
                status='active',
                environment=env,
                purchased_at=purchased_at,
                expires_at=expires_at,
                will_renew=False,
                store_transaction_id=event.transaction_id,
                revenuecat_app_user_id=app_user_id
            )
            logger.info(f"Marked subscription as will_renew=False for user {user_id}")
            
        elif event_type == 'EXPIRATION':
            # Sub has fully expired
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

        return {"status": "processed"}
