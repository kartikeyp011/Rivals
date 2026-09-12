from fastapi import APIRouter, Depends, Path, Request
from typing import List
from uuid import UUID
import logging
from asyncpg import Connection

from app.schemas.result import ResultResponse
from app.core.dependencies import get_db_connection, get_current_user
from app.repositories.result_repository import ResultRepository
from app.repositories.arena_repository import ArenaRepository
from app.repositories.participant_repository import ParticipantRepository
from app.core.errors import NotFoundError, ForbiddenError

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/arenas/{arena_id}/results", response_model=List[ResultResponse], status_code=200)
async def get_arena_results(
    request: Request,
    arena_id: UUID = Path(...),
    conn: Connection = Depends(get_db_connection),
    user_id: str = Depends(get_current_user)
):
    arena_repo = ArenaRepository(conn)
    participant_repo = ParticipantRepository(conn)
    result_repo = ResultRepository(conn)

    arena = await arena_repo.get_arena(arena_id)
    if not arena:
        raise NotFoundError("Arena not found")

    participant = await participant_repo.get_participant(arena_id, user_id)
    if arena.host_user_id != UUID(user_id) and not participant:
        raise ForbiddenError("Not authorized to view results")

    if arena.status != 'completed':
        # Contract doesn't strictly say to return 404/409, but returning empty list is fine 
        # or we could let it return empty.
        pass

    results = await result_repo.get_results_for_arena(arena_id)
    return results
