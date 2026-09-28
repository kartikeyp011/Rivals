from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.result import ResultResponse

class ResultRepository(BaseRepository):
    async def create_result(
        self, arena_id: UUID, user_id: str, final_rank: int, total_score: int, 
        rounds_won: int, rounds_played: int, is_winner: bool
    ) -> ResultResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_results (
                arena_id, user_id, final_rank, total_score, rounds_won, rounds_played, is_winner
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (arena_id, user_id) DO UPDATE
            SET final_rank = EXCLUDED.final_rank,
                total_score = EXCLUDED.total_score,
                rounds_won = EXCLUDED.rounds_won,
                rounds_played = EXCLUDED.rounds_played,
                is_winner = EXCLUDED.is_winner
            RETURNING *
            """,
            arena_id, user_id, final_rank, total_score, rounds_won, rounds_played, is_winner
        )
        return ResultResponse(**dict(row))

    async def get_results_for_arena(self, arena_id: UUID) -> List[ResultResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_results
            WHERE arena_id = $1
            ORDER BY final_rank ASC
            """,
            arena_id
        )
        return [ResultResponse(**dict(r)) for r in rows]

    async def get_results_for_user(self, user_id: str) -> List[ResultResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_results
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )
        return [ResultResponse(**dict(r)) for r in rows]
