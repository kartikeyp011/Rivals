import uuid
from typing import List
from fastapi import APIRouter, Depends
from asyncpg import Connection

from app.schemas.round import RoundResponse
from app.services.round_service import RoundService
from app.core.dependencies import get_current_user, get_db_connection

router = APIRouter(prefix="/arenas", tags=["rounds"])

def get_round_service(conn: Connection = Depends(get_db_connection)) -> RoundService:
    return RoundService(conn)

@router.get("/{arena_id}/rounds", response_model=List[RoundResponse])
async def list_rounds(
    arena_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: RoundService = Depends(get_round_service)
):
    return await service.get_rounds(arena_id, user_id)

@router.get("/{arena_id}/rounds/{round_id}", response_model=RoundResponse)
async def get_round(
    arena_id: uuid.UUID,
    round_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: RoundService = Depends(get_round_service)
):
    return await service.get_round(arena_id, round_id, user_id)
