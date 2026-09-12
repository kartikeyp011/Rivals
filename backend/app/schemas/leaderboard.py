from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class LeaderboardEntry(BaseModel):
    id: str
    user_id: str
    period: str
    period_key: str
    score: int
    rank: Optional[int] = None
    arenas_played: int
    arenas_won: int
    created_at: datetime
    updated_at: datetime

    # Display fields joined at query time
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
