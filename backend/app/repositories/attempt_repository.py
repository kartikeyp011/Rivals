from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.attempt import AttemptResponse

class AttemptRepository(BaseRepository):
    async def create_attempt(self, arena_id: UUID, round_id: UUID, user_id: str) -> AttemptResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_attempts (
                arena_id, round_id, user_id, status
            )
            VALUES ($1, $2, $3, 'in_progress')
            ON CONFLICT (round_id, user_id) DO NOTHING
            RETURNING *
            """,
            str(arena_id), str(round_id), user_id
        )
        if row:
            return AttemptResponse(**dict(row))
        
        # If it conflicted, fetch the existing one
        row = await self.conn.fetchrow(
            "SELECT * FROM arena_attempts WHERE round_id = $1 AND user_id = $2",
            str(round_id), user_id
        )
        return AttemptResponse(**dict(row))

    async def update_attempt(
        self, round_id: UUID, user_id: str, 
        selected_option: Optional[str] = None, 
        is_correct: Optional[bool] = None, 
        status: str = 'in_progress',
        response_ms: Optional[int] = None
    ) -> Optional[AttemptResponse]:
        
        # If status is submitted or timed_out, we also set submitted_at
        submitted_at_sql = "now()" if status in ('submitted', 'timed_out') else "NULL"
        if status == 'in_progress':
            submitted_at_sql = "submitted_at" # keep as is
            
        row = await self.conn.fetchrow(
            f"""
            UPDATE arena_attempts
            SET status = $3,
                selected_option = COALESCE($4, selected_option),
                is_correct = COALESCE($5, is_correct),
                response_ms = COALESCE($6, response_ms),
                submitted_at = {submitted_at_sql},
                updated_at = now()
            WHERE round_id = $1 AND user_id = $2
            RETURNING *
            """,
            str(round_id), user_id, status, selected_option, is_correct, response_ms
        )
        if row:
            return AttemptResponse(**dict(row))
        return None

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
