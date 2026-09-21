from asyncpg import Connection
from uuid import UUID
from datetime import datetime
from typing import Optional

class SubscriptionRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_user_id_by_uuid(self, auth_uuid: str) -> Optional[str]:
        # Validate that the app_user_id actually maps to a real auth.users record
        row = await self.conn.fetchrow(
            "SELECT id FROM auth.users WHERE id = $1",
            UUID(auth_uuid)
        )
        return str(row['id']) if row else None

    async def event_already_processed(self, event_id: str) -> bool:
        # Check if the event exists, if not, insert and return False.
        # This acts as our idempotency lock.
        try:
            await self.conn.execute(
                "INSERT INTO revenuecat_events (event_id) VALUES ($1)",
                event_id
            )
            return False
        except Exception as e:
            # If it's a unique constraint violation, it was already processed.
            if e.__class__.__name__ == 'UniqueViolationError' or 'unique constraint' in str(e).lower() or '23505' in str(e):
                return True
            raise e

    async def upsert_subscription(
        self,
        user_id: str,
        product_id: str,
        entitlement_id: str,
        status: str,
        environment: str,
        purchased_at: datetime,
        expires_at: Optional[datetime],
        will_renew: bool,
        store_transaction_id: str,
        revenuecat_app_user_id: str,
        original_purchase_at: Optional[datetime] = None
    ):
        await self.conn.execute(
            """
            INSERT INTO subscriptions (
                user_id, provider, product_id, entitlement_id, status, environment,
                original_purchase_at, purchased_at, expires_at, will_renew, store_transaction_id,
                revenuecat_app_user_id
            )
            VALUES (
                $1, 'revenuecat', $2, $3, $4, $5,
                $6, $7, $8, $9, $10, $11
            )
            ON CONFLICT (user_id, entitlement_id) DO UPDATE SET
                product_id = EXCLUDED.product_id,
                status = EXCLUDED.status,
                environment = EXCLUDED.environment,
                original_purchase_at = COALESCE(EXCLUDED.original_purchase_at, subscriptions.original_purchase_at),
                purchased_at = EXCLUDED.purchased_at,
                expires_at = EXCLUDED.expires_at,
                will_renew = EXCLUDED.will_renew,
                store_transaction_id = EXCLUDED.store_transaction_id,
                revenuecat_app_user_id = EXCLUDED.revenuecat_app_user_id,
                updated_at = now()
            """,
            UUID(user_id),
            product_id,
            entitlement_id,
            status,
            environment,
            original_purchase_at,
            purchased_at,
            expires_at,
            will_renew,
            store_transaction_id,
            revenuecat_app_user_id
        )

    async def update_subscription_status(self, user_id: str, entitlement_id: str, status: str, will_renew: bool):
        await self.conn.execute(
            """
            UPDATE subscriptions
            SET status = $1, will_renew = $2, updated_at = now()
            WHERE user_id = $3 AND entitlement_id = $4
            """,
            status,
            will_renew,
            UUID(user_id),
            entitlement_id
        )
