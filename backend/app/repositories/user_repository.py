from typing import List
from asyncpg import Connection

from app.schemas.user import UserSearchResponse

class UserRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def search_users(self, query: str, limit: int = 20) -> List[UserSearchResponse]:
        sql = """
            SELECT id, username, display_name, avatar_url
            FROM profiles
            WHERE username ILIKE $1 OR display_name ILIKE $1
            ORDER BY username ASC
            LIMIT $2
        """
        search_pattern = f"%{query}%"
        rows = await self.conn.fetch(sql, search_pattern, limit)
        return [UserSearchResponse(**dict(r)) for r in rows]
