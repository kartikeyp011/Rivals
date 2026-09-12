from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field
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
    max_participants: int = Field(default=2, ge=2, le=8)
    max_rounds: int = Field(default=5, ge=1, le=20)
    time_limit_seconds: int = Field(default=30, ge=5, le=300)
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
