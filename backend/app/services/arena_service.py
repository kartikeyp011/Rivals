from typing import Optional, List
from uuid import UUID
from asyncpg import Connection
from datetime import datetime, timezone

from app.schemas.arena import ArenaCreate, ArenaResponse
from app.schemas.config import ArenaConfigOptions
from app.repositories.arena_repository import ArenaRepository
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.round_repository import RoundRepository
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class ArenaService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.arena_repo = ArenaRepository(conn)
        self.participant_repo = ParticipantRepository(conn)
        self.round_repo = RoundRepository(conn)

    async def get_config_options(self) -> ArenaConfigOptions:
        rows = await self.conn.fetch("SELECT DISTINCT category FROM questions WHERE is_active = true")
        categories = [r['category'] for r in rows if r['category']]
        return ArenaConfigOptions(categories=categories)

    async def create_arena(self, host_user_id: str, data: ArenaCreate) -> ArenaResponse:
        # Create arena and add host as participant within a transaction
        async with self.conn.transaction():
            arena = await self.arena_repo.create_arena(host_user_id, data)
            # Add host as an active participant immediately
            await self.participant_repo.create_participant(arena.id, host_user_id, status='active')
            
            # Select random questions for the rounds
            # Depending on category/difficulty filters
            query = "SELECT id FROM questions WHERE is_active = true"
            params = []
            idx = 1
            if data.category:
                query += f" AND category = ${idx}"
                params.append(data.category)
                idx += 1
            if data.difficulty:
                query += f" AND difficulty = ${idx}"
                params.append(data.difficulty)
                idx += 1
                
            query += " ORDER BY RANDOM() LIMIT $" + str(idx)
            params.append(data.max_rounds)
            
            questions = await self.conn.fetch(query, *params)
            if len(questions) < data.max_rounds:
                raise ConflictError("Not enough questions available for the requested configuration")
                
            for round_num, q in enumerate(questions, start=1):
                await self.conn.execute(
                    """
                    INSERT INTO arena_rounds (arena_id, round_number, question_id, status)
                    VALUES ($1, $2, $3, 'pending')
                    """,
                    str(arena.id), round_num, q['id']
                )

            return arena

    async def get_or_create_daily_arena(self, user_id: str) -> ArenaResponse:
        now = datetime.now(timezone.utc)
        daily_date = now.strftime('%Y-%m-%d')

        # We need a transaction-level advisory lock
        import hashlib
        hash_str = f"{user_id}_{daily_date}"
        lock_id = int.from_bytes(hashlib.sha256(hash_str.encode()).digest()[:8], 'little', signed=True)

        async with self.conn.transaction():
            # Acquire transaction-level lock (waits until available)
            await self.conn.execute("SELECT pg_advisory_xact_lock($1)", lock_id)

            # Re-query: look for this user's daily arena for today
            row = await self.conn.fetchrow(
                """
                SELECT id FROM arenas
                WHERE host_user_id = $1
                AND category = 'daily'
                AND metadata->>'date' = $2
                AND status NOT IN ('cancelled')
                """,
                UUID(user_id), daily_date
            )

            if row:
                return await self.arena_repo.get_arena(row['id'])

            # Get 3 questions deterministically for this date
            questions = await self.conn.fetch(
                """
                SELECT id, category, difficulty
                FROM questions
                WHERE is_active = true
                ORDER BY md5($1 || id::text)
                LIMIT 3
                """,
                daily_date
            )

            if len(questions) < 3:
                raise ConflictError("Not enough questions available for the Daily Arena")

            # Daily Arena: single-player, immediately active, max_participants=1
            data = ArenaCreate(
                category='daily',
                max_participants=2,  # schema min is 2; we use metadata to identify as daily
                max_rounds=3,
                time_limit_seconds=60,
                metadata={'type': 'daily', 'date': daily_date}
            )

            arena = await self.arena_repo.create_arena(user_id, data)
            await self.participant_repo.create_participant(arena.id, user_id, status='active')

            for round_num, q in enumerate(questions, start=1):
                await self.conn.execute(
                    """
                    INSERT INTO arena_rounds (arena_id, round_number, question_id, status)
                    VALUES ($1, $2, $3, 'pending')
                    """,
                    arena.id, round_num, q['id']
                )

            # Immediately start the Daily Arena (no need to wait for other players)
            updated = await self.arena_repo.update_arena_status(arena.id, 'active', start_time=now)

            # Activate Round 1
            rounds = await self.round_repo.get_rounds_for_arena(arena.id)
            first_round = next((r for r in rounds if r.round_number == 1), None)
            if first_round:
                from datetime import timedelta
                ends_at = now + timedelta(seconds=60)
                await self.round_repo.update_round_status(
                    first_round.id, 'active', start_time=now, ends_at=ends_at, complete_time=None
                )
                # Pre-create attempt for the user (no other participants)
                from app.repositories.attempt_repository import AttemptRepository
                attempt_repo = AttemptRepository(self.conn)
                await attempt_repo.create_attempt(arena.id, first_round.id, user_id)

                import asyncio
                from app.routers.arenas import schedule_round_timeout
                asyncio.create_task(schedule_round_timeout(arena.id, first_round.id, ends_at))

            return updated

    async def get_arena(self, arena_id: UUID, user_id: str) -> ArenaResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        # Verify user has access (host or participant)
        participant = await self.participant_repo.get_participant(arena_id, user_id)
        if arena.host_user_id != UUID(user_id) and not participant:
            raise ForbiddenError("Not authorized to view this arena")
            
        return arena

    async def get_arenas_for_user(self, user_id: str) -> List[ArenaResponse]:
        return await self.arena_repo.get_arenas_for_user(user_id)

    async def start_arena(self, arena_id: UUID, user_id: str) -> ArenaResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        if arena.host_user_id != UUID(user_id):
            raise ForbiddenError("Only the host can start the arena")
            
        if arena.status != 'pending':
            raise ConflictError("Arena is not in pending state")

        # Check if this is a Daily Arena — daily arenas are solo and don't require 2 participants
        is_daily = arena.category == 'daily' or (arena.metadata and arena.metadata.get('type') == 'daily')

        participants = await self.participant_repo.get_participants_for_arena(arena_id)
        joined_participants = [p for p in participants if p.status == 'active']
        if not is_daily and len(joined_participants) < 2:
            raise ConflictError("At least 2 joined participants are required to start")

        async with self.conn.transaction():
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            updated = await self.arena_repo.update_arena_status(arena_id, 'active', start_time=now)
            
            # Start the first round
            rounds = await self.round_repo.get_rounds_for_arena(arena_id)
            if rounds:
                first_round = next((r for r in rounds if r.round_number == 1), None)
                if first_round:
                    from datetime import timedelta
                    ends_at = now + timedelta(seconds=arena.time_limit_seconds)
                    await self.round_repo.update_round_status(first_round.id, 'active', start_time=now, ends_at=ends_at, complete_time=None)
                    
                    # Pre-create attempts for active participants
                    from app.repositories.attempt_repository import AttemptRepository
                    attempt_repo = AttemptRepository(self.conn)
                    participants = await self.participant_repo.get_participants_for_arena(arena_id)
                    for p in participants:
                        if p.status == 'active':
                            await attempt_repo.create_attempt(arena_id, first_round.id, str(p.user_id))
                            
                    # Launch active timer
                    import asyncio
                    from app.routers.arenas import schedule_round_timeout
                    asyncio.create_task(schedule_round_timeout(arena_id, first_round.id, ends_at))

            return updated

    async def cancel_arena(self, arena_id: UUID, user_id: str) -> ArenaResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
            
        if arena.host_user_id != UUID(user_id):
            raise ForbiddenError("Only the host can cancel the arena")
            
        if arena.status not in ('pending', 'active'):
            raise ConflictError("Arena cannot be cancelled in its current state")
            
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        async with self.conn.transaction():
            updated = await self.arena_repo.update_arena_status(arena_id, 'cancelled', complete_time=now)
            
            # Resolve any attached wager (which will refund everyone since status is cancelled)
            from app.services.wager_service import WagerService
            wager_service = WagerService(self.conn)
            await wager_service.resolve_wager(arena_id)
        
        return updated
