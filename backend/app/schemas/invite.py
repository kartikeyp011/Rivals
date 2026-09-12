from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class InviteStatus(str, Enum):
    pending = 'pending'
    accepted = 'accepted'
    declined = 'declined'
    expired = 'expired'

class InviteCreate(BaseModel):
    invitee_id: UUID

class InviteResponse(BaseModel):
    id: UUID
    arena_id: UUID
    inviter_id: UUID
    invitee_id: UUID
    status: InviteStatus
    expires_at: datetime
    responded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
