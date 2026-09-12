from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

class StreakResponse(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date]
    free_recovery_available: bool
    created_at: datetime
    updated_at: datetime
