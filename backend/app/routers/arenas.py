import uuid
from typing import List
from fastapi import APIRouter, Depends, Header, Request, BackgroundTasks
from asyncpg import Connection

from app.schemas.arena import ArenaCreate, ArenaResponse
from app.services.arena_service import ArenaService
from app.core.dependencies import get_current_user, get_db_connection
from app.core.idempotency import IdempotencyManager

router = APIRouter(prefix="/arenas", tags=["arenas"])

def get_arena_service(conn: Connection = Depends(get_db_connection)) -> ArenaService:
    return ArenaService(conn)

@router.post("", response_model=ArenaResponse, status_code=201)
async def create_arena(
    data: ArenaCreate,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: ArenaService = Depends(get_arena_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    
    cached = await idem.get_cached_response(data.model_dump())
    if cached:
        return cached

    await idem.lock_key(request.url.path, data.model_dump(mode='json'))
    
    # Process
    arena = await service.create_arena(user_id, data)
    
    # Save Response
    await idem.save_response(201, arena.model_dump(mode='json'))
    return arena

@router.get("", response_model=List[ArenaResponse])
async def list_arenas(
    user_id: str = Depends(get_current_user),
    service: ArenaService = Depends(get_arena_service)
):
    return await service.get_arenas_for_user(user_id)

from app.schemas.config import ArenaConfigOptions

@router.get("/config/options", response_model=ArenaConfigOptions)
async def get_config_options(
    user_id: str = Depends(get_current_user),
    service: ArenaService = Depends(get_arena_service)
):
    return await service.get_config_options()

@router.get("/daily", response_model=ArenaResponse)
async def get_daily_arena(
    user_id: str = Depends(get_current_user),
    service: ArenaService = Depends(get_arena_service)
):
    return await service.get_or_create_daily_arena(user_id)

@router.get("/{arena_id}", response_model=ArenaResponse)
async def get_arena(
    arena_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    service: ArenaService = Depends(get_arena_service)
):
    return await service.get_arena(arena_id, user_id)

@router.post("/{arena_id}/start", response_model=ArenaResponse)
async def start_arena(
    arena_id: uuid.UUID,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: ArenaService = Depends(get_arena_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response(None)
    if cached:
        return cached

    await idem.lock_key(request.url.path)
    
    arena = await service.start_arena(arena_id, user_id)
    
    await idem.save_response(200, arena.model_dump(mode='json'))
    return arena

@router.post("/{arena_id}/cancel", response_model=ArenaResponse)
async def cancel_arena(
    arena_id: uuid.UUID,
    request: Request,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection),
    service: ArenaService = Depends(get_arena_service)
):
    idem = IdempotencyManager(conn, user_id, idempotency_key)
    cached = await idem.get_cached_response(None)
    if cached:
        return cached

    await idem.lock_key(request.url.path)
    
    arena = await service.cancel_arena(arena_id, user_id)
    
    await idem.save_response(200, arena.model_dump(mode='json'))
    return arena

import asyncio
from datetime import datetime, timezone

async def schedule_round_timeout(arena_id: uuid.UUID, round_id: uuid.UUID, ends_at: datetime):
    now = datetime.now(timezone.utc)
    delay = (ends_at - now).total_seconds()
    if delay > 0:
        await asyncio.sleep(delay)
    
    # After sleep, check if round should complete (timer expired)
    # Import here to avoid circular imports if any
    from app.core.db import get_connection
    from app.services.scoring_service import ScoringService
    
    async with get_connection() as conn:
        scoring_service = ScoringService(conn)
        try:
            # check_round_complete will lock the row, check if active, and handle timed_out attempts
            await scoring_service.check_round_complete(arena_id, round_id)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in background timeout task for arena {arena_id}, round {round_id}: {e}")
