import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request
from asyncpg import Connection

from app.schemas.participant import ParticipantResponse
from app.services.participant_service import ParticipantService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(prefix="/arenas", tags=["participants"])

def get_participant_service(conn: Connection = Depends(get_db_connection)) -> ParticipantService:
    return ParticipantService(conn)

@router.get("/{arena_id}/participants", response_model=List[ParticipantResponse])
async def list_participants(
    arena_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: ParticipantService = Depends(get_participant_service)
):
    return await service.get_participants(arena_id, user_id)

@router.post("/{arena_id}/participants/withdraw", response_model=ParticipantResponse)
async def withdraw_participant(
    arena_id: uuid.UUID,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: ParticipantService = Depends(get_participant_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response()
    if cached:
        return cached

    await idem.lock_key(request.url.path)
    
    participant = await service.withdraw_from_arena(arena_id, user_id)
    
    await idem.save_response(200, participant.model_dump(mode='json'))
    return participant
