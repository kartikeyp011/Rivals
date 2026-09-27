from typing import List, Optional
from uuid import UUID
from asyncpg import Connection
from app.schemas.wager import WagerResponse, WagerParticipantResponse, WagerStatus

class WagerRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_wager(self, wager_id: UUID) -> Optional[WagerResponse]:
        row = await self.conn.fetchrow("SELECT * FROM wagers WHERE id = $1", wager_id)
        if not row:
            return None
        return await self._build_wager_response(row)

    async def get_wager_by_arena(self, arena_id: UUID) -> Optional[WagerResponse]:
        row = await self.conn.fetchrow("SELECT * FROM wagers WHERE arena_id = $1", arena_id)
        if not row:
            return None
        return await self._build_wager_response(row)

    async def get_wagers_for_user(self, user_id: str) -> List[WagerResponse]:
        rows = await self.conn.fetch(
            """
            SELECT w.*
            FROM wagers w
            JOIN wager_participants wp ON w.id = wp.wager_id
            WHERE wp.user_id = $1
            ORDER BY w.created_at DESC
            """,
            UUID(user_id)
        )
        return [await self._build_wager_response(row) for row in rows]

    async def create_wager(self, arena_id: UUID, user_id: str, coin_amount: int) -> WagerResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO wagers (arena_id, created_by, status, coin_amount, total_pot)
            VALUES ($1, $2, 'open', $3, 0)
            RETURNING *
            """,
            arena_id, UUID(user_id), coin_amount
        )
        return await self._build_wager_response(row)

    async def add_participant(self, wager_id: UUID, user_id: str, coin_amount: int) -> WagerParticipantResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO wager_participants (wager_id, user_id, coin_amount)
            VALUES ($1, $2, $3)
            RETURNING *
            """,
            wager_id, UUID(user_id), coin_amount
        )
        return WagerParticipantResponse(**dict(row))
        
    async def get_participant(self, wager_id: UUID, user_id: str) -> Optional[WagerParticipantResponse]:
        row = await self.conn.fetchrow(
            "SELECT * FROM wager_participants WHERE wager_id = $1 AND user_id = $2",
            wager_id, UUID(user_id)
        )
        if not row:
            return None
        return WagerParticipantResponse(**dict(row))

    async def update_wager_status(self, wager_id: UUID, status: str, settled_at: Optional[str] = None) -> WagerResponse:
        query = "UPDATE wagers SET status = $1"
        params = [status]
        idx = 2
        if settled_at:
            query += f", settled_at = ${idx}"
            params.append(settled_at)
            idx += 1
        query += f" WHERE id = ${idx} RETURNING *"
        params.append(wager_id)
        
        row = await self.conn.fetchrow(query, *params)
        return await self._build_wager_response(row)

    async def update_total_pot(self, wager_id: UUID, amount_delta: int) -> WagerResponse:
        row = await self.conn.fetchrow(
            """
            UPDATE wagers
            SET total_pot = total_pot + $1
            WHERE id = $2
            RETURNING *
            """,
            amount_delta, wager_id
        )
        return await self._build_wager_response(row)

    async def update_participant_winnings(self, wager_id: UUID, user_id: UUID, coins_won: int):
        await self.conn.execute(
            """
            UPDATE wager_participants
            SET coins_won = $1
            WHERE wager_id = $2 AND user_id = $3
            """,
            coins_won, wager_id, user_id
        )

    async def _build_wager_response(self, wager_row) -> WagerResponse:
        wager_dict = dict(wager_row)
        
        participant_rows = await self.conn.fetch(
            """
            SELECT wp.*, p.username, p.avatar_url
            FROM wager_participants wp
            LEFT JOIN profiles p ON wp.user_id = p.id
            WHERE wp.wager_id = $1 ORDER BY wp.joined_at ASC
            """,
            wager_dict['id']
        )
        
        wager_dict['participants'] = [WagerParticipantResponse(**dict(pr)) for pr in participant_rows]
        return WagerResponse(**wager_dict)
