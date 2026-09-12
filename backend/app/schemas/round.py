from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class RoundStatus(str, Enum):
    pending = 'pending'
    active = 'active'
    scoring = 'scoring'
    completed = 'completed'

class RoundResponse(BaseModel):
    id: UUID
    arena_id: UUID
    round_number: int
    question_id: UUID
    status: RoundStatus
    started_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Nested question safe data (correct_option is omitted by the service layer)
    question_category: str
    question_difficulty: str
    question_prompt: str
    question_options: list
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
