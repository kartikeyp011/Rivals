from fastapi import APIRouter, Depends
from asyncpg import Connection

from app.core.db import get_db_connection
from app.core.security import get_current_user
from app.schemas.subscription_bonus import WeeklyBonusClaimResponse
from app.services.subscription_service import SubscriptionService

router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscriptions"]
)

@router.post("/rivals-plus/weekly-bonus/claim", response_model=WeeklyBonusClaimResponse)
async def claim_weekly_bonus(
    current_user: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection)
):
    service = SubscriptionService(conn)
    return await service.claim_weekly_bonus(user_id=current_user)
