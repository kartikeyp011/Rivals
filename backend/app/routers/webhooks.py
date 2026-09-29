from fastapi import APIRouter, Depends, Header, Request, HTTPException
from asyncpg import Connection
import logging
import hmac
import secrets

from app.core.config import settings
from app.core.db import get_db_connection
from app.schemas.revenuecat import RevenueCatEventRequest
from app.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def verify_revenuecat_webhook(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
        
    expected_secret = settings.REVENUECAT_WEBHOOK_SECRET
    
    # Extract Bearer token if presented that way, or just raw string
    token = authorization.replace("Bearer ", "").strip()
    
    # Secure constant-time comparison
    if not secrets.compare_digest(token.encode("utf-8"), expected_secret.encode("utf-8")):
        logger.warning("Unauthorized webhook request attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    return token

@router.post("/revenuecat")
async def revenuecat_webhook(
    payload: RevenueCatEventRequest,
    _: str = Depends(verify_revenuecat_webhook),
    conn: Connection = Depends(get_db_connection)
):
    service = SubscriptionService(conn)
    try:
        result = await service.handle_webhook(payload)
        return result
    except Exception as e:
        logger.exception("Error processing RevenueCat webhook")
        # Return 500 so RevenueCat will retry
        raise HTTPException(status_code=500, detail="Internal Server Error")
