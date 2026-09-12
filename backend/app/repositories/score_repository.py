from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.score import ScoreResponse

class ScoreRepository(BaseRepository):
    async def create_score(self, arena_id: UUID, round_id: UUID, user_id: str, points_earned: int, bonus_points: int) -> ScoreResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_scores (
                arena_id, round_id, user_id, points_earned, bonus_points
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (round_id, user_id) DO UPDATE
            SET points_earned = EXCLUDED.points_earned,
                bonus_points = EXCLUDED.bonus_points
            RETURNING *
            """,
            str(arena_id), str(round_id), user_id, points_earned, bonus_points
        )
        return ScoreResponse(**dict(row))

    async def get_scores_for_arena(self, arena_id: UUID) -> List[ScoreResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_scores
            WHERE arena_id = $1
            ORDER BY created_at DESC
            """,
            str(arena_id)
        )
        return [ScoreResponse(**dict(r)) for r in rows]

    async def get_scores_for_user(self, user_id: str) -> List[ScoreResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_scores
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )
        return [ScoreResponse(**dict(r)) for r in rows]
