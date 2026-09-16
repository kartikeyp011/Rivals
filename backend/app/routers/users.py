from typing import List
from fastapi import APIRouter, Depends, Query
from asyncpg import Connection

from app.schemas.user import UserSearchResponse
from app.services.user_service import UserService
from app.core.dependencies import get_current_user, get_db_connection

router = APIRouter(tags=["users"])

def get_user_service(conn: Connection = Depends(get_db_connection)) -> UserService:
    return UserService(conn)

@router.get("/api/v1/users/search", response_model=List[UserSearchResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    user_id: str = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return await service.search_users(q)

@router.delete("/api/v1/users/me")
async def delete_me(
    user_id: str = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return await service.delete_account(user_id)
