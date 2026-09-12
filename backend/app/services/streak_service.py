from asyncpg import Connection
from datetime import datetime, date, timedelta, timezone
from uuid import UUID
import zoneinfo
from app.schemas.streak import StreakResponse
from app.repositories.streak_repository import StreakRepository

class StreakService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = StreakRepository(conn)

    async def get_streak(self, user_id: str) -> StreakResponse:
        streak = await self.repo.get_streak(user_id)
        if not streak:
            # Return default streak state
            return StreakResponse(
                user_id=user_id,
                current_streak=0,
                longest_streak=0,
                last_activity_date=None,
                free_recovery_available=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
        return streak

    async def update_streak(self, user_id: str, completion_time_utc: datetime, timezone: str) -> StreakResponse:
        try:
            tz = zoneinfo.ZoneInfo(timezone)
        except Exception:
            tz = zoneinfo.ZoneInfo("UTC")
            
        local_date = completion_time_utc.astimezone(tz).date()
        
        streak = await self.get_streak(user_id)
        
        current_streak = streak.current_streak
        longest_streak = streak.longest_streak
        last_date = streak.last_activity_date
        
        if last_date == local_date:
            # Already completed today, idempotent
            return streak
        elif last_date == local_date - timedelta(days=1):
            # Consecutive day
            current_streak += 1
        else:
            # Missed a day or first time
            current_streak = 1
            
        if current_streak > longest_streak:
            longest_streak = current_streak
            
        return await self.repo.update_streak(user_id, current_streak, longest_streak, local_date)

    async def recover_streak(self, user_id: str, current_time_utc: datetime, timezone: str) -> StreakResponse:
        async with self.conn.transaction():
            # Acquire lock to prevent race condition on recovery usage
            await self.conn.fetchrow("SELECT id FROM profiles WHERE id = $1 FOR UPDATE", UUID(user_id))
            
            streak = await self.get_streak(user_id)
            if not streak.free_recovery_available:
                raise ValueError("Free recovery not available or already used")
                
            try:
                tz = zoneinfo.ZoneInfo(timezone)
            except Exception:
                tz = zoneinfo.ZoneInfo("UTC")
                
            local_date = current_time_utc.astimezone(tz).date()
            last_date = streak.last_activity_date
            
            # If there's no activity or they are already on a streak today/yesterday, recovery is invalid/unnecessary
            if not last_date or last_date >= local_date - timedelta(days=1):
                raise ValueError("Streak is already active, no recovery needed")
                
            # Recovery restores the current_streak to what it was, but we don't increment it until they play.
            # However, since they missed a day, they need to play today to keep it going. 
            # Actually, how does recovery work? It restores the streak count, and acts as if they played yesterday.
            # So we set last_activity_date = local_date - 1.
            restored_last_activity_date = local_date - timedelta(days=1)
            
            # Mark recovery as used
            await self.repo.use_free_recovery(user_id)
            # Update the streak date
            return await self.repo.update_streak(user_id, streak.current_streak, streak.longest_streak, restored_last_activity_date)
