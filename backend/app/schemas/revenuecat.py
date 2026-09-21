from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RevenueCatEventEvent(BaseModel):
    id: str
    type: str
    app_user_id: str
    aliases: Optional[list[str]] = None
    original_app_user_id: Optional[str] = None
    product_id: Optional[str] = None
    entitlement_ids: Optional[list[str]] = None
    period_type: Optional[str] = None
    purchased_at_ms: Optional[int] = None
    expiration_at_ms: Optional[int] = None
    environment: str
    store: str
    transaction_id: Optional[str] = None
    original_transaction_id: Optional[str] = None
    
    # Optional fields for various event types
    cancel_reason: Optional[str] = None
    new_product_id: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')

class RevenueCatEventRequest(BaseModel):
    api_version: str
    event: RevenueCatEventEvent
    
    model_config = ConfigDict(extra='ignore')
