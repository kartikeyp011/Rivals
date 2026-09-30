from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

AdAction = Literal['create_arena', 'create_wager', 'claim_reward']
AdIntentStatus = Literal['pending', 'completed', 'used', 'failed']

class AdIntentCreate(BaseModel):
    action: AdAction

class AdIntentResponse(BaseModel):
    id: UUID
    action: AdAction
    status: AdIntentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
