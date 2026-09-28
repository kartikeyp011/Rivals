from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class LeaderboardEntry(BaseModel):
    id: Optional[str] = None
    user_id: str
    period: str
    period_key: str
    score: int
    rank: Optional[int] = None
    arenas_played: int
    arenas_won: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Display fields joined at query time
    username: Optional[str] = None
    avatar_url: Optional[str] = None
