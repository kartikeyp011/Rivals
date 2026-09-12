from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class ResultResponse(BaseModel):
    id: UUID
    arena_id: UUID
    user_id: UUID
    final_rank: int
    total_score: int
    rounds_won: int
    rounds_played: int
    coins_awarded: int
    is_winner: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
