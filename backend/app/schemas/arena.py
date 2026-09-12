from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class ArenaStatus(str, Enum):
    pending = 'pending'
    active = 'active'
    completed = 'completed'
    cancelled = 'cancelled'

class QuestionDifficulty(str, Enum):
    easy = 'easy'
    medium = 'medium'
    hard = 'hard'
    expert = 'expert'

class ArenaBase(BaseModel):
    category: Optional[str] = None
    difficulty: Optional[QuestionDifficulty] = None
    max_participants: int = 2
    max_rounds: int = 5
    time_limit_seconds: int = 30
    metadata: Optional[dict] = None

class ArenaCreate(ArenaBase):
    pass

class ArenaResponse(ArenaBase):
    id: UUID
    host_user_id: UUID
    status: ArenaStatus
    scheduled_start_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
