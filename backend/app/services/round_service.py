from typing import Optional, List
from uuid import UUID
from asyncpg import Connection

from app.schemas.round import RoundResponse
from app.repositories.round_repository import RoundRepository
from app.repositories.arena_repository import ArenaRepository
from app.repositories.participant_repository import ParticipantRepository
from app.core.errors import NotFoundError, ForbiddenError

class RoundService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.round_repo = RoundRepository(conn)
        self.arena_repo = ArenaRepository(conn)
        self.participant_repo = ParticipantRepository(conn)

    async def get_rounds(self, arena_id: UUID, user_id: str) -> List[RoundResponse]:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if arena.host_user_id != UUID(user_id) and not participant:
            raise ForbiddenError("Not authorized to view rounds of this arena")
            
        # The frontend expects safe puzzle content without the authoritative answer, 
        # which our repository query naturally supports because we don't return `correct_option`.
        return await self.round_repo.get_rounds_for_arena(arena_id)

    async def get_round(self, arena_id: UUID, round_id: UUID, user_id: str) -> RoundResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if arena.host_user_id != UUID(user_id) and not participant:
            raise ForbiddenError("Not authorized to view rounds of this arena")
            
        rnd = await self.round_repo.get_round(round_id)
        if not rnd or rnd.arena_id != arena_id:
            raise NotFoundError("Round not found in this arena")
            
        return rnd
