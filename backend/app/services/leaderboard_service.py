from typing import List, Optional
from asyncpg import Connection
from datetime import datetime
import zoneinfo
from app.schemas.leaderboard import LeaderboardEntry
from app.repositories.leaderboard_repository import LeaderboardRepository

class LeaderboardService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = LeaderboardRepository(conn)

    async def record_score(self, user_id: str, completion_time_utc: datetime, timezone: str, score: int, is_winner: bool = False):
        # For daily period, we define the canonical leaderboard day as UTC.
        daily_period_key = completion_time_utc.date().isoformat()
        
        # Upsert daily
        await self.repo.upsert_score(user_id, "daily", daily_period_key, score, is_winner)
        # Upsert all-time
        await self.repo.upsert_score(user_id, "all_time", "all_time", score, is_winner)

    async def get_global_leaderboard(self, period: str, period_key: str, limit: int = 100) -> List[LeaderboardEntry]:
        return await self.repo.get_global_leaderboard(period, period_key, limit)

    async def get_friends_leaderboard(self, user_id: str, period: str, period_key: str, limit: int = 100) -> List[LeaderboardEntry]:
        return await self.repo.get_friends_leaderboard(user_id, period, period_key, limit)

    async def get_user_leaderboard(self, user_id: str, period: str, period_key: str) -> Optional[LeaderboardEntry]:
        return await self.repo.get_user_rank(user_id, period, period_key)
