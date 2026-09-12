import uuid
from typing import List
from fastapi import APIRouter, Depends
from asyncpg import Connection

from app.schemas.coin import CoinBalanceResponse, CoinLedgerResponse
from app.services.coin_service import CoinService
from app.core.dependencies import get_current_user, get_db_connection

router = APIRouter(prefix="/coins", tags=["coins"])

def get_coin_service(conn: Connection = Depends(get_db_connection)) -> CoinService:
    return CoinService(conn)

@router.get("/balance", response_model=CoinBalanceResponse)
async def get_balance(
    user_id: str = Depends(get_current_user),
    service: CoinService = Depends(get_coin_service)
):
    balance = await service.get_balance(user_id)
    return CoinBalanceResponse(user_id=uuid.UUID(user_id), balance=balance)

@router.get("/transactions", response_model=List[CoinLedgerResponse])
async def get_transactions(
    limit: int = 50,
    user_id: str = Depends(get_current_user),
    service: CoinService = Depends(get_coin_service)
):
    return await service.get_transactions(user_id, limit)
