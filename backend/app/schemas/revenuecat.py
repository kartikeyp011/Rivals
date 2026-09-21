from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RevenueCatEventEvent(BaseModel):
    id: str
    type: str
    app_user_id: str
    aliases: list[str]
    original_app_user_id: str
    product_id: str
    entitlement_ids: list[str]
    period_type: str
    purchased_at_ms: int
    expiration_at_ms: Optional[int] = None
    environment: str
    store: str
    transaction_id: str
    original_transaction_id: str
    
    # Optional fields for various event types
    cancel_reason: Optional[str] = None
    new_product_id: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')

class RevenueCatEventRequest(BaseModel):
    api_version: str
    event: RevenueCatEventEvent
    
    model_config = ConfigDict(extra='ignore')
