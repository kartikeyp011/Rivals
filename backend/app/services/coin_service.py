from typing import List, Optional
from uuid import UUID
from asyncpg import Connection

from app.schemas.coin import CoinLedgerResponse, CoinLedgerType, CoinLedgerReason
from app.repositories.coin_repository import CoinRepository
from app.core.errors import ConflictError

class CoinService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.coin_repo = CoinRepository(conn)

    async def get_balance(self, user_id: str) -> int:
        # Fast check without lock
        txs = await self.coin_repo.get_transactions(user_id, 1)
        if not txs:
            async with self.conn.transaction():
                # Acquire row lock to serialize concurrent first-time requests
                await self._lock_user(user_id)
                # Re-check under lock
                txs = await self.coin_repo.get_transactions(user_id, 1)
                if not txs:
                    # Idempotent initialization
                    await self.coin_repo.insert_ledger_entry(
                        user_id=user_id,
                        type=CoinLedgerType.credit,
                        reason=CoinLedgerReason.admin_adjustment,
                        amount=100,
                        balance_after=100
                    )
        return await self.coin_repo.get_balance(user_id)

    async def get_transactions(self, user_id: str, limit: int = 50) -> List[CoinLedgerResponse]:
        return await self.coin_repo.get_transactions(user_id, limit)

    async def add_coins(
        self,
        user_id: str,
        amount: int,
        reason: CoinLedgerReason,
        reference_id: Optional[UUID] = None,
        reference_table: Optional[str] = None
    ) -> CoinLedgerResponse:
        if amount <= 0:
            raise ValueError("Amount must be positive")

        async with self.conn.transaction():
            # Acquire lock on profiles row to serialize balance mutations
            await self._lock_user(user_id)
            
            current_balance = await self.coin_repo.get_balance(user_id)
            new_balance = current_balance + amount
            
            return await self.coin_repo.insert_ledger_entry(
                user_id=user_id,
                type=CoinLedgerType.credit,
                reason=reason,
                amount=amount,
                balance_after=new_balance,
                reference_id=reference_id,
                reference_table=reference_table
            )

    async def deduct_coins(
        self,
        user_id: str,
        amount: int,
        reason: CoinLedgerReason,
        reference_id: Optional[UUID] = None,
        reference_table: Optional[str] = None
    ) -> CoinLedgerResponse:
        if amount <= 0:
            raise ValueError("Amount must be positive")

        async with self.conn.transaction():
            # Acquire lock on profiles row to serialize balance mutations
            await self._lock_user(user_id)
            
            current_balance = await self.coin_repo.get_balance(user_id)
            if current_balance < amount:
                raise ConflictError("Insufficient coins")
                
            new_balance = current_balance - amount
            
            return await self.coin_repo.insert_ledger_entry(
                user_id=user_id,
                type=CoinLedgerType.debit,
                reason=reason,
                amount=amount,
                balance_after=new_balance,
                reference_id=reference_id,
                reference_table=reference_table
            )

    async def _lock_user(self, user_id: str):
        # Acquires a row-level lock on the user's profiles row to prevent race conditions
        # during concurrent coin balance mutations.
        row = await self.conn.fetchrow(
            "SELECT id FROM profiles WHERE id = $1 FOR UPDATE",
            UUID(user_id)
        )
        if not row:
            # Fallback if profile somehow doesn't exist (e.g. testing context without trigger)
            # We lock the auth.users row instead.
            await self.conn.fetchrow(
                "SELECT id FROM auth.users WHERE id = $1 FOR UPDATE",
                UUID(user_id)
            )
