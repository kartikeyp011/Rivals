from typing import Optional, List
from uuid import UUID
import json
from .base import BaseRepository
from app.schemas.arena import ArenaResponse, ArenaCreate

class ArenaRepository(BaseRepository):
    async def create_arena(self, host_user_id: str, data: ArenaCreate) -> ArenaResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arenas (
                host_user_id, max_participants, max_rounds, time_limit_seconds,
                category, difficulty, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            host_user_id,
            data.max_participants,
            data.max_rounds,
            data.time_limit_seconds,
            data.category,
            data.difficulty,
            json.dumps(data.metadata) if data.metadata else None
        )
        row_dict = dict(row)
        if row_dict.get('metadata') and isinstance(row_dict['metadata'], str):
            row_dict['metadata'] = json.loads(row_dict['metadata'])
        return ArenaResponse(**row_dict)

    async def get_arena(self, arena_id: UUID) -> Optional[ArenaResponse]:
        row = await self.conn.fetchrow(
            "SELECT * FROM arenas WHERE id = $1",
            str(arena_id)
        )
        if row:
            row_dict = dict(row)
            if row_dict.get('metadata') and isinstance(row_dict['metadata'], str):
                row_dict['metadata'] = json.loads(row_dict['metadata'])
            return ArenaResponse(**row_dict)
        return None

    async def get_arenas_for_user(self, user_id: str) -> List[ArenaResponse]:
        # User can see arenas they host or participate in
        rows = await self.conn.fetch(
            """
            SELECT DISTINCT a.* 
            FROM arenas a
            LEFT JOIN arena_participants p ON a.id = p.arena_id
            WHERE a.host_user_id = $1 OR p.user_id = $1
            ORDER BY a.created_at DESC
            """,
            user_id
        )
        res = []
        for r in rows:
            r_dict = dict(r)
            if r_dict.get('metadata') and isinstance(r_dict['metadata'], str):
                r_dict['metadata'] = json.loads(r_dict['metadata'])
            res.append(ArenaResponse(**r_dict))
        return res

    async def update_arena_status(self, arena_id: UUID, status: str, 
                                  start_time: Optional['datetime'] = None, 
                                  complete_time: Optional['datetime'] = None) -> Optional[ArenaResponse]:
        # Only updates status and timestamp dynamically
        
        updates = ["status = $2"]
        params = [str(arena_id), status]
        idx = 3
        
        if start_time:
            updates.append(f"started_at = ${idx}")
            params.append(start_time)
            idx += 1
        
        if complete_time:
            updates.append(f"completed_at = ${idx}")
            params.append(complete_time)
            idx += 1
            
        set_clause = ", ".join(updates)
        
        row = await self.conn.fetchrow(
            f"""
            UPDATE arenas
            SET {set_clause}
            WHERE id = $1
            RETURNING *
            """,
            *params
        )
        if row:
            row_dict = dict(row)
            if row_dict.get('metadata') and isinstance(row_dict['metadata'], str):
                row_dict['metadata'] = json.loads(row_dict['metadata'])
            return ArenaResponse(**row_dict)
        return None
