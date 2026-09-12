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
    selected_option: str
    response_ms: Optional[int] = None

class AttemptResponse(BaseModel):
    id: UUID
    round_id: UUID
    user_id: UUID
    status: AttemptStatus
    selected_option: Optional[str] = None
    is_correct: Optional[bool] = None
    response_ms: Optional[int] = None
    points_awarded: Optional[int] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
