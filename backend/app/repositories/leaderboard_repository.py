from typing import List, Optional
from uuid import UUID
from asyncpg import Connection
from app.schemas.leaderboard import LeaderboardEntry

class LeaderboardRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def upsert_score(self, user_id: str, period: str, period_key: str, score: int, is_winner: bool) -> LeaderboardEntry:
        # Upsert logic: add score if existing, else insert.
        # But wait, PRD says Arena Score is the score for the day. If a user plays again, does it overwrite?
        # A user can only play the Daily Arena once per day (or unlimited attempts until complete). The final score is recorded.
        # We'll use DO UPDATE SET score = EXCLUDED.score to overwrite, or GREATEST(leaderboards.score, EXCLUDED.score).
        # We will just use GREATEST for all time, and for daily, it's just the daily score.
        row = await self.conn.fetchrow(
            """
            INSERT INTO leaderboards (user_id, period, period_key, score, arenas_played, arenas_won)
            VALUES ($1, $2, $3, $4, 1, $5)
            ON CONFLICT (user_id, period, period_key) DO UPDATE SET
                score = GREATEST(leaderboards.score, EXCLUDED.score)
            RETURNING *
            """,
            UUID(user_id), period, period_key, score, 1 if is_winner else 0
        )
        d = dict(row)
        d['id'] = str(d['id'])
        d['user_id'] = str(d['user_id'])
        return LeaderboardEntry(**d)

    async def get_global_leaderboard(self, period: str, period_key: str, limit: int = 100) -> List[LeaderboardEntry]:
        rows = await self.conn.fetch(
            """
            SELECT 
                l.*, 
                p.username, 
                p.display_name, 
                p.avatar_url,
                RANK() OVER (ORDER BY l.score DESC) as rank
            FROM leaderboards l
            JOIN profiles p ON l.user_id = p.id
            WHERE l.period = $1 AND l.period_key = $2 AND p.global_opt_in = TRUE
            ORDER BY l.score DESC
            LIMIT $3
            """,
            period, period_key, limit
        )
        result = []
        for row in rows:
            d = dict(row)
            d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            result.append(LeaderboardEntry(**d))
        return result

    async def get_friends_leaderboard(self, user_id: str, period: str, period_key: str, limit: int = 100) -> List[LeaderboardEntry]:
        rows = await self.conn.fetch(
            """
            SELECT 
                l.*, 
                p.username, 
                p.display_name, 
                p.avatar_url,
                RANK() OVER (ORDER BY l.score DESC) as rank
            FROM leaderboards l
            JOIN profiles p ON l.user_id = p.id
            WHERE l.period = $1 AND l.period_key = $2
              AND (
                  l.user_id = $3
                  OR l.user_id IN (
                      SELECT friend_id FROM friends WHERE user_id = $3 AND status = 'accepted'
                  )
              )
            ORDER BY l.score DESC
            LIMIT $4
            """,
            period, period_key, UUID(user_id), limit
        )
        result = []
        for row in rows:
            d = dict(row)
            d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            result.append(LeaderboardEntry(**d))
        return result

    async def get_user_rank(self, user_id: str, period: str, period_key: str) -> Optional[LeaderboardEntry]:
        row = await self.conn.fetchrow(
            """
            WITH UserScore AS (
                SELECT score FROM leaderboards 
                WHERE user_id = $1 AND period = $2 AND period_key = $3
            ),
            RankInfo AS (
                SELECT COUNT(*) + 1 as rank
                FROM leaderboards l
                JOIN profiles p ON l.user_id = p.id
                WHERE l.period = $2 AND l.period_key = $3 AND p.global_opt_in = TRUE
                AND l.score > (SELECT score FROM UserScore)
            )
            SELECT l.*, p.username, p.display_name, p.avatar_url, r.rank
            FROM leaderboards l
            JOIN profiles p ON l.user_id = p.id
            CROSS JOIN RankInfo r
            WHERE l.user_id = $1 AND l.period = $2 AND l.period_key = $3
            """,
            UUID(user_id), period, period_key
        )
        if row:
            d = dict(row)
            d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            return LeaderboardEntry(**d)
        return None
