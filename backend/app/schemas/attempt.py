from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class AttemptStatus(str, Enum):
    in_progress = 'in_progress'
    submitted = 'submitted'
    timed_out = 'timed_out'
    void = 'void'

class AttemptCreate(BaseModel):
    submitted_answer: str

class AttemptResponse(BaseModel):
    id: UUID
    round_id: UUID
    user_id: UUID
    status: AttemptStatus
    submitted_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    points_awarded: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
