from typing import Optional, List
from uuid import UUID
from asyncpg import Connection

from app.schemas.participant import ParticipantResponse
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.arena_repository import ArenaRepository
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class ParticipantService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.participant_repo = ParticipantRepository(conn)
        self.arena_repo = ArenaRepository(conn)

    async def withdraw_from_arena(self, arena_id: UUID, user_id: str) -> ParticipantResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")

        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if not participant:
            raise NotFoundError("Participant not found")
            
        if arena.status == 'completed' or arena.status == 'cancelled':
            raise ConflictError("Cannot withdraw from a completed or cancelled arena")

        # The host cannot withdraw, they must cancel the arena
        if arena.host_user_id == UUID(user_id):
            raise ConflictError("Host cannot withdraw, they must cancel the arena")

        updated = await self.participant_repo.update_participant_status(arena_id, user_id, 'withdrawn')
        return updated

    async def get_participants(self, arena_id: UUID, user_id: str) -> List[ParticipantResponse]:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if arena.host_user_id != UUID(user_id) and not participant:
            raise ForbiddenError("Not authorized to view participants of this arena")

        return await self.participant_repo.get_participants_for_arena(arena_id)
