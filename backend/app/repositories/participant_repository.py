from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.participant import ParticipantResponse

class ParticipantRepository(BaseRepository):
    async def create_participant(self, arena_id: UUID, user_id: str, status: str = 'invited') -> ParticipantResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_participants (arena_id, user_id, status)
            VALUES ($1, $2, $3)
            RETURNING *
            """,
            str(arena_id), user_id, status
        )
        return ParticipantResponse(**dict(row))

    async def get_participant(self, arena_id: UUID, user_id: str) -> Optional[ParticipantResponse]:
        row = await self.conn.fetchrow(
            "SELECT * FROM arena_participants WHERE arena_id = $1 AND user_id = $2",
            str(arena_id), user_id
        )
        if row:
            return ParticipantResponse(**dict(row))
        return None

    async def update_participant_status(self, arena_id: UUID, user_id: str, status: str) -> Optional[ParticipantResponse]:
        row = await self.conn.fetchrow(
            """
            UPDATE arena_participants
            SET status = $3
            WHERE arena_id = $1 AND user_id = $2
            RETURNING *
            """,
            str(arena_id), user_id, status
        )
        if row:
            return ParticipantResponse(**dict(row))
        return None

    async def get_participants_for_arena(self, arena_id: UUID) -> List[ParticipantResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_participants
            WHERE arena_id = $1
            ORDER BY joined_at ASC NULLS LAST
            """,
            str(arena_id)
        )
        return [ParticipantResponse(**dict(r)) for r in rows]
