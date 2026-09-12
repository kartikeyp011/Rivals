from fastapi import APIRouter, Depends, HTTPException, Header, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import logging

from app.schemas.streak import StreakResponse
from app.core.db import get_db_connection
from asyncpg import Connection
from app.services.streak_service import StreakService
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/streaks", tags=["streaks"])

@router.get("/me", response_model=StreakResponse)
async def get_my_streak(
    current_user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection)
):
    service = StreakService(conn)
    return await service.get_streak(current_user_id)

@router.post("/recover", response_model=StreakResponse)
async def recover_streak(
    current_user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection)
):
    service = StreakService(conn)
    now = datetime.now(timezone.utc)
    # Get user profile timezone
    row = await conn.fetchrow("SELECT timezone FROM profiles WHERE id = $1", UUID(current_user_id))
    tz = row['timezone'] if row and row['timezone'] else 'UTC'
    
    try:
        return await service.recover_streak(current_user_id, now, tz)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
