from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
import math
import logging

from asyncpg import Connection
from app.repositories.score_repository import ScoreRepository
from app.repositories.result_repository import ResultRepository
from app.repositories.round_repository import RoundRepository
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.arena_repository import ArenaRepository

logger = logging.getLogger(__name__)

class ScoringService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.score_repo = ScoreRepository(conn)
        self.result_repo = ResultRepository(conn)
        self.round_repo = RoundRepository(conn)
        self.attempt_repo = AttemptRepository(conn)
        self.participant_repo = ParticipantRepository(conn)
        self.arena_repo = ArenaRepository(conn)

    async def score_attempt(self, arena_id: UUID, round_id: UUID, user_id: str, is_correct: bool, started_at: datetime, ends_at: datetime, submitted_at: datetime):
        if not is_correct:
            return None

        # Base points for correct answer
        points_earned = 100
        
        # Calculate speed bonus
        time_limit_seconds = (ends_at - started_at).total_seconds()
        elapsed_seconds = (submitted_at - started_at).total_seconds()
        
        # Linear decay from 50 to 0
        bonus_points = 0
        if time_limit_seconds > 0 and elapsed_seconds <= time_limit_seconds:
            bonus = 50 * (1 - (elapsed_seconds / time_limit_seconds))
            bonus_points = max(0, math.floor(bonus))
            
        return await self.score_repo.create_score(arena_id, round_id, user_id, points_earned, bonus_points)

    async def check_round_complete(self, arena_id: UUID, round_id: UUID):
        # We need to lock the round so that concurrent submissions don't both advance the round
        row = await self.conn.fetchrow("SELECT status FROM arena_rounds WHERE id = $1 FOR UPDATE", str(round_id))
        if not row or row['status'] != 'active':
            return # Already completed or not active

        # Count active participants
        participants = await self.participant_repo.get_participants_for_arena(arena_id)
        active_user_ids = [p.user_id for p in participants if p.status == 'active']

        # Get attempts for this round
        attempts = await self.attempt_repo.get_attempts_for_round(round_id)
        
        # A round completes if all active participants have submitted a correct answer or timed_out
        # In our logic, an attempt is terminal if status in ('submitted', 'timed_out', 'void') 
        # (submitted here means correct, since incorrect leaves it in_progress)
        all_terminal = True
        for user_id in active_user_ids:
            user_attempt = next((a for a in attempts if str(a.user_id) == str(user_id)), None)
            if not user_attempt or user_attempt.status not in ('submitted', 'timed_out', 'void'):
                all_terminal = False
                break
                
        # We don't check time expiry here, because that's handled by a separate background task or before this call.
        if all_terminal:
            await self.advance_round(arena_id, round_id)
            
    async def advance_round(self, arena_id: UUID, current_round_id: UUID):
        # Mark current round as completed
        await self.round_repo.update_round_status(current_round_id, 'completed', complete_time=datetime.now(timezone.utc))
        
        # Handle timed_out for attempts still in_progress
        await self.conn.execute(
            """
            UPDATE arena_attempts 
            SET status = 'timed_out', submitted_at = now(), updated_at = now()
            WHERE round_id = $1 AND status = 'in_progress'
            """,
            str(current_round_id)
        )
        
        # Check if there is a next round
        arena = await self.arena_repo.get_arena(arena_id)
        rounds = await self.round_repo.get_rounds_for_arena(arena_id)
        
        next_round = next((r for r in rounds if r.status == 'pending'), None)
        if next_round:
            # Start the next round
            now = datetime.now(timezone.utc)
            from datetime import timedelta
            ends_at = now + timedelta(seconds=arena.time_limit_seconds)
            
            await self.round_repo.update_round_status(next_round.id, 'active', start_time=now, complete_time=None)
            await self.conn.execute(
                "UPDATE arena_rounds SET ends_at = $1 WHERE id = $2",
                ends_at, str(next_round.id)
            )
            
            # Pre-create attempts for active participants
            participants = await self.participant_repo.get_participants_for_arena(arena_id)
            for p in participants:
                if p.status == 'active':
                    await self.attempt_repo.create_attempt(arena_id, next_round.id, str(p.user_id))
                    
            # Launch active timer for the new round
            import asyncio
            from app.routers.arenas import schedule_round_timeout
            asyncio.create_task(schedule_round_timeout(arena_id, next_round.id, ends_at))
            
        else:
            # No more rounds, complete the arena
            await self.complete_arena(arena_id)
            
    async def complete_arena(self, arena_id: UUID):
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena or arena.status == 'completed':
            return
            
        # Collect scores and calculate totals
        scores = await self.score_repo.get_scores_for_arena(arena_id)
        participants = await self.participant_repo.get_participants_for_arena(arena_id)
        
        user_totals = {}
        user_rounds_won = {}
        for p in participants:
            user_totals[str(p.user_id)] = 0
            user_rounds_won[str(p.user_id)] = 0
            
        for s in scores:
            uid = str(s.user_id)
            if uid in user_totals:
                user_totals[uid] += s.total_points
                user_rounds_won[uid] += 1 # Any score means a correct answer in a round
                
        # Rank them
        sorted_users = sorted(user_totals.items(), key=lambda x: x[1], reverse=True)
        
        highest_score = sorted_users[0][1] if sorted_users else 0
        
        rounds_played = len(await self.round_repo.get_rounds_for_arena(arena_id))
        
        # Write results
        rank = 1
        async with self.conn.transaction():
            for uid, total in sorted_users:
                is_winner = (total == highest_score and total > 0) if len(sorted_users) > 1 else True # Solo player wins automatically
                await self.result_repo.create_result(
                    arena_id=arena_id,
                    user_id=uid,
                    final_rank=rank,
                    total_score=total,
                    rounds_won=user_rounds_won[uid],
                    rounds_played=rounds_played,
                    is_winner=is_winner
                )
                # Mark participant as completed
                await self.participant_repo.update_participant_status(arena_id, uid, 'completed')
                
                # Update streak and leaderboard
                from app.services.streak_service import StreakService
                from app.services.leaderboard_service import LeaderboardService
                from datetime import datetime, timezone as dt_timezone
                
                now = datetime.now(dt_timezone.utc)
                row = await self.conn.fetchrow("SELECT timezone FROM profiles WHERE id = $1", uid)
                tz = row['timezone'] if row and row['timezone'] else 'UTC'
                
                streak_service = StreakService(self.conn)
                await streak_service.update_streak(uid, now, tz)
                
                leaderboard_service = LeaderboardService(self.conn)
                await leaderboard_service.record_score(uid, now, tz, total, is_winner)
                
                rank += 1
            # Mark arena as completed
            await self.arena_repo.update_arena_status(arena_id, 'completed')

            # Resolve any attached wager
            from app.services.wager_service import WagerService
            wager_service = WagerService(self.conn)
            await wager_service.resolve_wager(arena_id)
