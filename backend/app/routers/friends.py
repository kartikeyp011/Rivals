import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request, Body
from asyncpg import Connection

from app.schemas.friend import FriendResponse, FriendRequestCreate
from app.services.friend_service import FriendService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(tags=["friends"])

def get_friend_service(conn: Connection = Depends(get_db_connection)) -> FriendService:
    return FriendService(conn)

@router.get("/api/v1/friends", response_model=List[FriendResponse])
async def list_friends(
    user_id: str = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return await service.get_accepted_friends(user_id)

@router.get("/api/v1/friends/requests/pending", response_model=List[FriendResponse])
async def list_pending_requests(
    user_id: str = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return await service.get_pending_requests(user_id)

@router.post("/api/v1/friends/requests", response_model=FriendResponse, status_code=201)
async def send_friend_request(
    data: FriendRequestCreate,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: FriendService = Depends(get_friend_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump(mode='json'))
    
    friend_req = await service.send_friend_request(user_id, data)
    
    await idem.save_response(201, friend_req.model_dump(mode='json'))
    return friend_req

@router.put("/api/v1/friends/requests/{request_id}/respond", response_model=FriendResponse)
async def respond_to_friend_request(
    request_id: uuid.UUID,
    request: Request,
    accept: bool = Body(..., embed=True),
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: FriendService = Depends(get_friend_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, {"accept": accept})
    
    friend_res = await service.respond_to_request(request_id, user_id, accept)
    
    await idem.save_response(200, friend_res.model_dump(mode='json'))
    return friend_res

@router.delete("/api/v1/friends/{friend_id}", status_code=204)
async def remove_friend(
    friend_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    await service.delete_friendship(friend_id, user_id)
