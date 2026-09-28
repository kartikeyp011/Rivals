from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.round import RoundResponse

class RoundRepository(BaseRepository):
    async def get_rounds_for_arena(self, arena_id: UUID) -> List[RoundResponse]:
        rows = await self.conn.fetch(
            """
            SELECT 
                r.id, r.arena_id, r.round_number, r.question_id, r.status, 
                r.started_at, r.ends_at, r.completed_at, r.created_at, r.updated_at,
                q.category as question_category, 
                q.difficulty as question_difficulty, 
                q.prompt as question_prompt, 
                q.options as question_options
            FROM arena_rounds r
            JOIN questions q ON r.question_id = q.id
            WHERE r.arena_id = $1
            ORDER BY r.round_number ASC
            """,
            arena_id
        )
        import json
        out = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('question_options'), str):
                d['question_options'] = json.loads(d['question_options'])
            out.append(RoundResponse(**d))
        return out

    async def get_round(self, round_id: UUID) -> Optional[RoundResponse]:
        row = await self.conn.fetchrow(
            """
            SELECT 
                r.id, r.arena_id, r.round_number, r.question_id, r.status, 
                r.started_at, r.ends_at, r.completed_at, r.created_at, r.updated_at,
                q.category as question_category, 
                q.difficulty as question_difficulty, 
                q.prompt as question_prompt, 
                q.options as question_options
            FROM arena_rounds r
            JOIN questions q ON r.question_id = q.id
            WHERE r.id = $1
            """,
            round_id
        )
        if row:
            d = dict(row)
            import json
            if isinstance(d.get('question_options'), str):
                d['question_options'] = json.loads(d['question_options'])
            return RoundResponse(**d)
        return None

    async def update_round_status(self, round_id: UUID, status: str, 
                                  start_time: Optional['datetime'] = None, 
                                  ends_at: Optional['datetime'] = None,
                                  complete_time: Optional['datetime'] = None) -> Optional[RoundResponse]:
        updates = ["status = $2"]
        params = [round_id, status]
        idx = 3
        
        if start_time:
            updates.append(f"started_at = ${idx}")
            params.append(start_time)
            idx += 1
            
        if ends_at:
            updates.append(f"ends_at = ${idx}")
            params.append(ends_at)
            idx += 1
        
        if complete_time:
            updates.append(f"completed_at = ${idx}")
            params.append(complete_time)
            idx += 1
            
        set_clause = ", ".join(updates)
        
        # We need the full response, so we update and then return using get_round
        await self.conn.execute(
            f"""
            UPDATE arena_rounds
            SET {set_clause}
            WHERE id = $1
            """,
            *params
        )
        
        return await self.get_round(round_id)

    async def get_correct_option_for_round(self, round_id: UUID) -> str:
        """Fetch the correct option directly from the questions table, bypassing the view."""
        row = await self.conn.fetchrow(
            """
            SELECT q.correct_option 
            FROM arena_rounds r
            JOIN questions q ON r.question_id = q.id
            WHERE r.id = $1
            """,
            round_id
        )
        if row:
            return row['correct_option']
        raise ValueError("Round not found")
