from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from enum import Enum

class CoinLedgerType(str, Enum):
    credit = 'credit'
    debit = 'debit'

class CoinLedgerReason(str, Enum):
    arena_wager_placed = 'arena_wager_placed'
    arena_wager_won = 'arena_wager_won'
    arena_wager_refund = 'arena_wager_refund'
    arena_prize = 'arena_prize'
    purchase = 'purchase'
    daily_reward = 'daily_reward'
    admin_adjustment = 'admin_adjustment'
    weekly_bonus = 'weekly_bonus'
    rewarded_ad = 'rewarded_ad'

class CoinBalanceResponse(BaseModel):
    user_id: UUID
    balance: int

class CoinLedgerResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: CoinLedgerType
    reason: CoinLedgerReason
    amount: int
    balance_after: int
    reference_id: Optional[UUID] = None
    reference_table: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
