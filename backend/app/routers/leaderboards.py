from fastapi import APIRouter, Depends, Query
from typing import List
from app.schemas.leaderboard import LeaderboardEntry
from app.core.db import get_db_connection
from asyncpg import Connection
from app.services.leaderboard_service import LeaderboardService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/leaderboards", tags=["leaderboards"])

@router.get("/global", response_model=List[LeaderboardEntry])
async def get_global_leaderboard(
    period: str = Query("daily", description="daily or all_time"),
    period_key: str = Query(..., description="Date string (YYYY-MM-DD) or 'all_time'"),
    limit: int = Query(100, ge=1, le=1000),
    current_user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection)
):
    service = LeaderboardService(conn)
    return await service.get_global_leaderboard(period, period_key, limit)

@router.get("/friends", response_model=List[LeaderboardEntry])
async def get_friends_leaderboard(
    period: str = Query("daily", description="daily or all_time"),
    period_key: str = Query(..., description="Date string (YYYY-MM-DD) or 'all_time'"),
    limit: int = Query(100, ge=1, le=1000),
    current_user_id: str = Depends(get_current_user),
    conn: Connection = Depends(get_db_connection)
):
    service = LeaderboardService(conn)
    return await service.get_friends_leaderboard(current_user_id, period, period_key, limit)
