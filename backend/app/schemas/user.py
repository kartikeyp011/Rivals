from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class UserSearchResponse(BaseModel):
    id: UUID
    username: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
