from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum
from uuid import UUID

class FriendStatus(str, Enum):
    pending = 'pending'
    accepted = 'accepted'
    rejected = 'rejected'

class FriendRequestCreate(BaseModel):
    friend_id: UUID

class FriendResponse(BaseModel):
    id: UUID
    user_id: UUID
    friend_id: UUID
    status: FriendStatus
    created_at: datetime
    
    # Extra fields for the UI, populated via JOIN with profiles
    friend_username: str
    friend_display_name: Optional[str] = None
    friend_avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
