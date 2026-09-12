from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from enum import Enum

class WagerStatus(str, Enum):
    open = 'open'
    locked = 'locked'
    settled = 'settled'
    voided = 'voided'

class WagerCreate(BaseModel):
    arena_id: UUID
    coin_amount: int

class WagerParticipantResponse(BaseModel):
    id: UUID
    wager_id: UUID
    user_id: UUID
    coin_amount: int
    coins_won: Optional[int] = None
    joined_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WagerResponse(BaseModel):
    id: UUID
    arena_id: UUID
    created_by: UUID
    status: WagerStatus
    coin_amount: int
    total_pot: int
    settled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    participants: List[WagerParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)
