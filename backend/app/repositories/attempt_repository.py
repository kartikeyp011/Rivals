from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.attempt import AttemptResponse

class AttemptRepository(BaseRepository):
    async def create_attempt(self, round_id: UUID, user_id: str, submitted_answer: str, is_correct: bool, points_awarded: int) -> AttemptResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_attempts (
                round_id, user_id, status, submitted_answer, is_correct, points_awarded, submitted_at
            )
            VALUES ($1, $2, 'submitted', $3, $4, $5, now())
            RETURNING *
            """,
            str(round_id), user_id, submitted_answer, is_correct, points_awarded
        )
        return AttemptResponse(**dict(row))

    async def get_attempts_for_round(self, round_id: UUID) -> List[AttemptResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_attempts
            WHERE round_id = $1
            ORDER BY created_at DESC
            """,
            str(round_id)
        )
        return [AttemptResponse(**dict(r)) for r in rows]

    async def get_attempts_for_user(self, round_id: UUID, user_id: str) -> List[AttemptResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_attempts
            WHERE round_id = $1 AND user_id = $2
            ORDER BY created_at DESC
            """,
            str(round_id), user_id
        )
        return [AttemptResponse(**dict(r)) for r in rows]
