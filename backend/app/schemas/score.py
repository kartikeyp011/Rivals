from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class ScoreResponse(BaseModel):
    id: UUID
    arena_id: UUID
    round_id: UUID
    user_id: UUID
    points_earned: int
    bonus_points: int
    total_points: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
