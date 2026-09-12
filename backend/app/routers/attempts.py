import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request
from asyncpg import Connection

from app.schemas.attempt import AttemptCreate, AttemptResponse
from app.services.attempt_service import AttemptService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(prefix="/arenas", tags=["attempts"])

def get_attempt_service(conn: Connection = Depends(get_db_connection)) -> AttemptService:
    return AttemptService(conn)

@router.post("/{arena_id}/rounds/{round_id}/attempts", response_model=AttemptResponse, status_code=200)
async def create_attempt(
    arena_id: uuid.UUID,
    round_id: uuid.UUID,
    data: AttemptCreate,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: AttemptService = Depends(get_attempt_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump(mode='json'))
    
    attempt = await service.create_attempt(arena_id, round_id, user_id, data)
    
    await idem.save_response(200, attempt.model_dump(mode='json'))
    return attempt

@router.get("/{arena_id}/rounds/{round_id}/attempts", response_model=List[AttemptResponse])
async def list_attempts(
    arena_id: uuid.UUID,
    round_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: AttemptService = Depends(get_attempt_service)
):
    return await service.get_attempts(arena_id, round_id, user_id)

@router.get("/{arena_id}/rounds/{round_id}/attempts/me", response_model=List[AttemptResponse])
async def get_my_attempts(
    arena_id: uuid.UUID,
    round_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: AttemptService = Depends(get_attempt_service)
):
    return await service.get_attempts_me(arena_id, round_id, user_id)
