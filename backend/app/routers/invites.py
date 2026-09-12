import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request, Body
from asyncpg import Connection

from app.schemas.invite import InviteCreate, InviteResponse
from app.services.invite_service import InviteService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(tags=["invites"])

def get_invite_service(conn: Connection = Depends(get_db_connection)) -> InviteService:
    return InviteService(conn)

@router.get("/api/v1/invites", response_model=List[InviteResponse])
async def list_invites(
    user_id: str = Depends(get_current_user),
    service: InviteService = Depends(get_invite_service)
):
    return await service.get_invites_for_user(user_id)

@router.post("/arenas/{arena_id}/invites", response_model=InviteResponse, status_code=201)
async def create_invite(
    arena_id: uuid.UUID,
    data: InviteCreate,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: InviteService = Depends(get_invite_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump())
    
    invite = await service.create_invite(arena_id, user_id, data)
    
    await idem.save_response(201, invite.model_dump(mode='json'))
    return invite

@router.post("/invites/{invite_id}/respond", response_model=InviteResponse)
async def respond_to_invite(
    invite_id: uuid.UUID,
    request: Request,
    accept: bool = Body(..., embed=True),
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: InviteService = Depends(get_invite_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, {"accept": accept})
    
    invite = await service.respond_to_invite(invite_id, user_id, accept)
    
    await idem.save_response(200, invite.model_dump(mode='json'))
    return invite
