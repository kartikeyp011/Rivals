import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request
from asyncpg import Connection

from app.schemas.wager import WagerCreate, WagerResponse
from app.services.wager_service import WagerService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(prefix="/wagers", tags=["wagers"])

def get_wager_service(conn: Connection = Depends(get_db_connection)) -> WagerService:
    return WagerService(conn)

@router.post("", response_model=WagerResponse, status_code=201)
async def create_wager(
    data: WagerCreate,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: WagerService = Depends(get_wager_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump(mode='json'))
    
    wager = await service.create_wager(user_id, data)
    
    await idem.save_response(201, wager.model_dump(mode='json'))
    return wager

@router.get("", response_model=List[WagerResponse])
async def list_my_wagers(
    user_id: str = Depends(get_current_user),
    service: WagerService = Depends(get_wager_service)
):
    return await service.get_wagers_for_user(user_id)

@router.get("/{wager_id}", response_model=WagerResponse)
async def get_wager(
    wager_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: WagerService = Depends(get_wager_service)
):
    # Technically any authenticated user can view the wager for now
    return await service.get_wager(wager_id)

@router.post("/{wager_id}/accept", response_model=WagerResponse, status_code=200)
async def accept_wager(
    wager_id: uuid.UUID,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: WagerService = Depends(get_wager_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, None)
    
    wager = await service.accept_wager(wager_id, user_id)
    
    await idem.save_response(200, wager.model_dump(mode='json'))
    return wager

@router.post("/{wager_id}/decline", status_code=200)
async def decline_wager(
    wager_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: WagerService = Depends(get_wager_service)
):
    return await service.decline_wager(wager_id, user_id)
