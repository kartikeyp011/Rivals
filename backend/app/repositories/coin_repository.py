from typing import List, Optional
from uuid import UUID
from asyncpg import Connection
from app.schemas.coin import CoinLedgerResponse, CoinLedgerType, CoinLedgerReason

class CoinRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_balance(self, user_id: str) -> int:
        row = await self.conn.fetchrow(
            """
            SELECT balance_after
            FROM coin_ledger
            WHERE user_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            UUID(user_id)
        )
        return row['balance_after'] if row else 0

    async def get_transactions(self, user_id: str, limit: int = 50) -> List[CoinLedgerResponse]:
        rows = await self.conn.fetch(
            """
            SELECT *
            FROM coin_ledger
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            UUID(user_id), limit
        )
        return [CoinLedgerResponse(**dict(r)) for r in rows]

    async def insert_ledger_entry(
        self,
        user_id: str,
        type: CoinLedgerType,
        reason: CoinLedgerReason,
        amount: int,
        balance_after: int,
        reference_id: Optional[UUID] = None,
        reference_table: Optional[str] = None
    ) -> CoinLedgerResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO coin_ledger (user_id, type, reason, amount, balance_after, reference_id, reference_table)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            UUID(user_id), type.value, reason.value, amount, balance_after, reference_id, reference_table
        )
        return CoinLedgerResponse(**dict(row))
