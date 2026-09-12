from typing import List
from asyncpg import Connection

from app.schemas.user import UserSearchResponse
from app.repositories.user_repository import UserRepository

class UserService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = UserRepository(conn)

    async def search_users(self, query: str) -> List[UserSearchResponse]:
        if not query or len(query) < 2:
            return []
        return await self.repo.search_users(query)
