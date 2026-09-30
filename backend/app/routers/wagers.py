import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request
from asyncpg import Connection

from app.schemas.wager import WagerCreate, WagerResponse
from app.services.wager_service import WagerService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.ad_service import AdService

router = APIRouter(prefix="/wagers", tags=["wagers"])

def get_wager_service(conn: Connection = Depends(get_db_connection)) -> WagerService:
    return WagerService(conn)

@router.post("", response_model=WagerResponse, status_code=201)
async def create_wager(
    data: WagerCreate,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_client_version: int = Header(1, alias="X-Client-Version"),
    ad_intent_id: str = Header(None, alias="Ad-Intent-Id"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: WagerService = Depends(get_wager_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump(mode='json'))
    
    # Ad Gate for new clients
    if x_client_version >= 2:
        sub_repo = SubscriptionRepository(conn)
        active_sub = await sub_repo.get_active_subscription(user_id, 'rivals_plus')
        if not active_sub or active_sub['status'] != 'active':
            # User is free, enforce ad requirement
            if not ad_intent_id:
                from app.core.errors import ForbiddenError
                raise ForbiddenError("Rewarded ad completion required to create Wager")

            import uuid
            ad_service = AdService(conn)
            await ad_service.consume_intent(uuid.UUID(ad_intent_id), user_id, 'create_wager')

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
