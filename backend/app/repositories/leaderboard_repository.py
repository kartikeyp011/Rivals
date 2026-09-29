from typing import List, Optional
from uuid import UUID
from asyncpg import Connection
from app.schemas.leaderboard import LeaderboardEntry
from app.core.config import settings

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
                l.id,
                p.id as user_id,
                $1 as period,
                $2 as period_key,
                COALESCE(l.score, 0) as score,
                COALESCE(l.arenas_played, 0) as arenas_played,
                COALESCE(l.arenas_won, 0) as arenas_won,
                l.created_at,
                l.updated_at,
                p.username, 
                p.avatar_url,
                RANK() OVER (ORDER BY COALESCE(l.score, 0) DESC) as rank
            FROM profiles p
            LEFT JOIN leaderboards l ON l.user_id = p.id AND l.period = $1 AND l.period_key = $2
            WHERE p.global_opt_in = TRUE
              AND COALESCE(l.score, 0) > 0
              AND ($4::text = '' OR p.username !~ $4::text)
            ORDER BY COALESCE(l.score, 0) DESC, LOWER(p.username) ASC
            LIMIT $3
            """,
            period, period_key, limit, settings.HIDDEN_USERNAME_REGEX
        )
        result = []
        for row in rows:
            d = dict(row)
            if d.get('id'): d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            result.append(LeaderboardEntry(**d))
        return result

    async def get_friends_leaderboard(self, user_id: str, period: str, period_key: str, limit: int = 100) -> List[LeaderboardEntry]:
        rows = await self.conn.fetch(
            """
            SELECT 
                l.id,
                p.id as user_id,
                $1 as period,
                $2 as period_key,
                COALESCE(l.score, 0) as score,
                COALESCE(l.arenas_played, 0) as arenas_played,
                COALESCE(l.arenas_won, 0) as arenas_won,
                l.created_at,
                l.updated_at,
                p.username, 
                p.avatar_url,
                RANK() OVER (ORDER BY COALESCE(l.score, 0) DESC) as rank
            FROM profiles p
            LEFT JOIN leaderboards l ON l.user_id = p.id AND l.period = $1 AND l.period_key = $2
            WHERE (
                  p.id = $3
                  OR p.id IN (
                      SELECT friend_id FROM friends WHERE user_id = $3 AND status = 'accepted'
                  )
              )
              AND ($5::text = '' OR p.id = $3 OR p.username !~ $5::text)
            ORDER BY COALESCE(l.score, 0) DESC, LOWER(p.username) ASC
            LIMIT $4
            """,
            period, period_key, UUID(user_id), limit, settings.HIDDEN_USERNAME_REGEX
        )
        result = []
        for row in rows:
            d = dict(row)
            if d.get('id'): d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            result.append(LeaderboardEntry(**d))
        return result

    async def get_user_rank(self, user_id: str, period: str, period_key: str) -> Optional[LeaderboardEntry]:
        row = await self.conn.fetchrow(
            """
            WITH UserScore AS (
                SELECT COALESCE(l.score, 0) as score
                FROM profiles p
                LEFT JOIN leaderboards l ON l.user_id = p.id AND l.period = $2 AND l.period_key = $3
                WHERE p.id = $1
            ),
            RankInfo AS (
                SELECT COUNT(*) + 1 as rank
                FROM profiles p
                LEFT JOIN leaderboards l ON l.user_id = p.id AND l.period = $2 AND l.period_key = $3
                WHERE p.global_opt_in = TRUE
                AND ($4::text = '' OR p.username !~ $4::text)
                AND COALESCE(l.score, 0) > (SELECT score FROM UserScore)
            )
            SELECT
                l.id,
                p.id as user_id,
                $2 as period,
                $3 as period_key,
                COALESCE(l.score, 0) as score,
                COALESCE(l.arenas_played, 0) as arenas_played,
                COALESCE(l.arenas_won, 0) as arenas_won,
                l.created_at,
                l.updated_at,
                p.username,
                p.avatar_url,
                r.rank
            FROM profiles p
            LEFT JOIN leaderboards l ON l.user_id = p.id AND l.period = $2 AND l.period_key = $3
            CROSS JOIN RankInfo r
            WHERE p.id = $1
            """,
            UUID(user_id), period, period_key, settings.HIDDEN_USERNAME_REGEX
        )
        if row:
            d = dict(row)
            if d.get('id'): d['id'] = str(d['id'])
            d['user_id'] = str(d['user_id'])
            return LeaderboardEntry(**d)
        return None
