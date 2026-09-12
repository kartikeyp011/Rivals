from typing import Optional, List
from uuid import UUID
from asyncpg import Connection
from datetime import datetime, timezone

from app.schemas.attempt import AttemptCreate, AttemptResponse
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.round_repository import RoundRepository
from app.repositories.arena_repository import ArenaRepository
from app.repositories.participant_repository import ParticipantRepository
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class AttemptService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.attempt_repo = AttemptRepository(conn)
        self.round_repo = RoundRepository(conn)
        self.arena_repo = ArenaRepository(conn)
        self.participant_repo = ParticipantRepository(conn)

    async def create_attempt(self, arena_id: UUID, round_id: UUID, user_id: str, data: AttemptCreate) -> AttemptResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")

        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if not participant or participant.status != 'active':
            raise ForbiddenError("Only active participants can submit attempts")

        rnd = await self.round_repo.get_round(round_id)
        if not rnd or rnd.arena_id != arena_id:
            raise NotFoundError("Round not found in this arena")

        if rnd.status != 'active':
            raise ConflictError("Attempts can only be submitted for active rounds")

        # Step 5 ONLY: Write the attempt to the database.
        # Do NOT implement scoring, timers, correctness evaluation, or round advancement.
        # Those belong to Step 6 (Game Logic).
        async with self.conn.transaction():
            attempt = await self.attempt_repo.create_attempt(
                round_id=round_id,
                user_id=user_id,
                submitted_answer=data.submitted_answer,
                is_correct=False,  # Deferred to Step 6
                points_awarded=0   # Deferred to Step 6
            )
            return attempt

    async def get_attempts(self, arena_id: UUID, round_id: UUID, user_id: str) -> List[AttemptResponse]:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if arena.host_user_id != UUID(user_id) and not participant:
            raise ForbiddenError("Not authorized to view attempts")

        rnd = await self.round_repo.get_round(round_id)
        if not rnd or rnd.arena_id != arena_id:
            raise NotFoundError("Round not found")

        return await self.attempt_repo.get_attempts_for_round(round_id)

    async def get_attempts_me(self, arena_id: UUID, round_id: UUID, user_id: str) -> List[AttemptResponse]:
        # Validations
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        rnd = await self.round_repo.get_round(round_id)
        if not rnd or rnd.arena_id != arena_id:
            raise NotFoundError("Round not found")

        return await self.attempt_repo.get_attempts_for_user(round_id, user_id)
