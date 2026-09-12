from typing import Optional
from uuid import UUID
from asyncpg import Connection
from datetime import date
from app.schemas.streak import StreakResponse

class StreakRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_streak(self, user_id: str) -> Optional[StreakResponse]:
        row = await self.conn.fetchrow("SELECT * FROM streaks WHERE user_id = $1", UUID(user_id))
        if not row:
            return None
        d = dict(row)
        d['user_id'] = str(d['user_id'])
        return StreakResponse(**d)

    async def update_streak(self, user_id: str, current_streak: int, longest_streak: int, last_activity_date: date) -> StreakResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET
                current_streak = EXCLUDED.current_streak,
                longest_streak = EXCLUDED.longest_streak,
                last_activity_date = EXCLUDED.last_activity_date
            RETURNING *
            """,
            UUID(user_id), current_streak, longest_streak, last_activity_date
        )
        d = dict(row)
        d['user_id'] = str(d['user_id'])
        return StreakResponse(**d)

    async def use_free_recovery(self, user_id: str) -> StreakResponse:
        row = await self.conn.fetchrow(
            """
            UPDATE streaks
            SET free_recovery_available = FALSE
            WHERE user_id = $1
            RETURNING *
            """,
            UUID(user_id)
        )
        if row is None:
            raise ValueError("No streak record found for this user")
        d = dict(row)
        d['user_id'] = str(d['user_id'])
        return StreakResponse(**d)
