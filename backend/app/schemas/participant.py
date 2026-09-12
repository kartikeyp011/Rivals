from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class ParticipantStatus(str, Enum):
    invited = 'invited'
    active = 'active'
    eliminated = 'eliminated'
    withdrawn = 'withdrawn'
    completed = 'completed'

class ParticipantResponse(BaseModel):
    arena_id: UUID
    user_id: UUID
    status: ParticipantStatus
    joined_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
