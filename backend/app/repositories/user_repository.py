from typing import List
from asyncpg import Connection

from app.schemas.user import UserSearchResponse

class UserRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def search_users(self, query: str, limit: int = 20) -> List[UserSearchResponse]:
        sql = """
            SELECT id, username, avatar_url
            FROM profiles
            WHERE username ILIKE $1
            ORDER BY username ASC
            LIMIT $2
        """
        search_pattern = f"%{query}%"
        rows = await self.conn.fetch(sql, search_pattern, limit)
        return [UserSearchResponse(**dict(r)) for r in rows]

    async def delete_user_data(self, user_id: str) -> None:
        """
        Deletes all personal/participation data for a user to satisfy ON DELETE RESTRICT constraints.
        Must be called within a transaction.
        """
        await self.conn.execute("DELETE FROM arena_scores WHERE user_id = $1", user_id)
        await self.conn.execute("DELETE FROM arena_results WHERE user_id = $1", user_id)
        await self.conn.execute("DELETE FROM arena_attempts WHERE user_id = $1", user_id)
        await self.conn.execute("DELETE FROM arena_invites WHERE inviter_id = $1 OR invitee_id = $1", user_id)
        await self.conn.execute("DELETE FROM arena_participants WHERE user_id = $1", user_id)
        await self.conn.execute("DELETE FROM wager_participants WHERE user_id = $1", user_id)
        await self.conn.execute("DELETE FROM coin_ledger WHERE user_id = $1", user_id)

    async def get_apple_refresh_token(self, user_id: str) -> str | None:
        """
        Best-effort retrieval of the Apple provider_refresh_token from Supabase auth.identities.
        """
        sql = """
            SELECT identity_data->>'provider_refresh_token' as token
            FROM auth.identities
            WHERE user_id = $1 AND provider = 'apple'
            LIMIT 1
        """
        row = await self.conn.fetchrow(sql, user_id)
        return row['token'] if row and row['token'] else None
