from asyncpg import Connection
from uuid import UUID
from typing import Optional

from app.schemas.ad import AdIntentCreate, AdIntentResponse

class AdRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def create_intent(self, user_id: str, action: str) -> AdIntentResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO ad_intents (user_id, action, status, expires_at)
            VALUES ($1, $2, 'pending', timezone('utc'::text, now()) + interval '30 minutes')
            RETURNING id, action, status, created_at
            """,
            UUID(user_id), action
        )
        return AdIntentResponse(**dict(row))

    async def get_intent(self, intent_id: UUID) -> Optional[dict]:
        row = await self.conn.fetchrow(
            "SELECT * FROM ad_intents WHERE id = $1",
            intent_id
        )
        return dict(row) if row else None

    async def mark_intent_completed(self, intent_id: UUID):
        await self.conn.execute(
            """
            UPDATE ad_intents
            SET status = 'completed', completed_at = timezone('utc'::text, now())
            WHERE id = $1 AND status = 'pending'
            """,
            intent_id
        )

    async def consume_intent(self, intent_id: UUID, user_id: str, expected_action: str) -> bool:
        # Returns True if successfully consumed (was 'completed'), False otherwise
        result = await self.conn.execute(
            """
            UPDATE ad_intents
            SET status = 'used', used_at = timezone('utc'::text, now())
            WHERE id = $1
            AND user_id = $2
            AND action = $3
            AND status = 'completed'
            AND expires_at > timezone('utc'::text, now())
            """,
            intent_id, UUID(user_id), expected_action
        )
        return result == 'UPDATE 1'

    async def record_ssv_event(self, event_id: str, intent_id: UUID, reward_amount: int, reward_item: str, key_id: str) -> bool:
        # Returns True if inserted, False if already exists (idempotency)
        try:
            await self.conn.execute(
                """
                INSERT INTO admob_ssv_events (event_id, intent_id, reward_amount, reward_item, key_id)
                VALUES ($1, $2, $3, $4, $5)
                """,
                event_id, intent_id, reward_amount, reward_item, key_id
            )
            return True
        except Exception as e:
            if 'unique constraint' in str(e).lower() or '23505' in str(e):
                return False
            raise e
