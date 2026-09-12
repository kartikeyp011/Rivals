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

        from app.services.scoring_service import ScoringService
        scoring_service = ScoringService(self.conn)

        async with self.conn.transaction():
            # Check time limit
            now = datetime.now(timezone.utc)
            if rnd.ends_at and now > rnd.ends_at:
                raise ConflictError("Round time limit has expired")

            # Check if already submitted correctly
            existing_attempts = await self.attempt_repo.get_attempts_for_user(round_id, user_id)
            existing = existing_attempts[0] if existing_attempts else None
            
            if existing and existing.status in ('submitted', 'timed_out', 'void'):
                raise ConflictError(f"Attempt is already in terminal state: {existing.status}")

            # Validate answer
            correct_option = await self.round_repo.get_correct_option_for_round(round_id)
            is_correct = (data.selected_option == correct_option)

            status = 'submitted' if is_correct else 'in_progress'

            attempt = await self.attempt_repo.update_attempt(
                round_id=round_id,
                user_id=user_id,
                selected_option=data.selected_option,
                is_correct=is_correct,
                status=status,
                response_ms=data.response_ms
            )
            
            # If there was no existing attempt, it means the user was not active when the round started
            # or the pre-creation failed. We should reject or create.
            if not attempt:
                raise ConflictError("No active attempt found for this round")

            if is_correct:
                await scoring_service.score_attempt(
                    arena_id=arena_id,
                    round_id=round_id,
                    user_id=user_id,
                    is_correct=is_correct,
                    started_at=rnd.started_at,
                    ends_at=rnd.ends_at,
                    submitted_at=attempt.submitted_at or now
                )

            # Check for round completion
            await scoring_service.check_round_complete(arena_id, round_id)

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
