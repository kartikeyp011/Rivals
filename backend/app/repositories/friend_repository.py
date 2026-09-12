from typing import Optional, List
from uuid import UUID
from asyncpg import Connection, Record

from app.schemas.friend import FriendResponse, FriendStatus
from app.core.errors import NotFoundError, ConflictError

class FriendRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_friendship(self, user_id: str, friend_id: str) -> Optional[FriendResponse]:
        query = """
            SELECT f.*, p.username as friend_username, p.display_name as friend_display_name, p.avatar_url as friend_avatar_url
            FROM friends f
            JOIN profiles p ON f.friend_id = p.id
            WHERE f.user_id = $1 AND f.friend_id = $2
        """
        row = await self.conn.fetchrow(query, UUID(user_id), UUID(friend_id))
        return FriendResponse(**dict(row)) if row else None

    async def get_friendship_by_id(self, request_id: UUID) -> Optional[Record]:
        query = """
            SELECT * FROM friends WHERE id = $1
        """
        return await self.conn.fetchrow(query, request_id)

    async def create_friend_request(self, user_id: str, friend_id: str) -> FriendResponse:
        query = """
            INSERT INTO friends (user_id, friend_id, status)
            VALUES ($1, $2, 'pending')
            RETURNING *
        """
        try:
            row = await self.conn.fetchrow(query, UUID(user_id), UUID(friend_id))
            return await self.get_friendship(user_id, friend_id)
        except Exception as e:
            if "uq_friends_pair" in str(e):
                raise ConflictError("Friend request already exists or user is already a friend")
            if "chk_no_self_friend" in str(e):
                raise ConflictError("Cannot send a friend request to yourself")
            if "fk_" in str(e).lower() or "foreign key" in str(e).lower():
                raise NotFoundError("User not found")
            raise e

    async def update_friend_status(self, request_id: UUID, status: FriendStatus) -> None:
        query = """
            UPDATE friends
            SET status = $1
            WHERE id = $2
        """
        await self.conn.execute(query, status.value, request_id)

    async def insert_reciprocal_friend(self, user_id: str, friend_id: str) -> None:
        query = """
            INSERT INTO friends (user_id, friend_id, status)
            VALUES ($1, $2, 'accepted')
            ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'
        """
        await self.conn.execute(query, UUID(user_id), UUID(friend_id))

    async def delete_friendship(self, user_id: str, friend_id: str) -> None:
        query = """
            DELETE FROM friends
            WHERE (user_id = $1 AND friend_id = $2)
               OR (user_id = $2 AND friend_id = $1)
        """
        await self.conn.execute(query, UUID(user_id), UUID(friend_id))

    async def get_friends_by_status(self, user_id: str, status: FriendStatus) -> List[FriendResponse]:
        query = """
            SELECT f.*, p.username as friend_username, p.display_name as friend_display_name, p.avatar_url as friend_avatar_url
            FROM friends f
            JOIN profiles p ON f.friend_id = p.id
            WHERE f.user_id = $1 AND f.status = $2
            ORDER BY f.created_at DESC
        """
        rows = await self.conn.fetch(query, UUID(user_id), status.value)
        return [FriendResponse(**dict(r)) for r in rows]

    async def get_pending_requests_for_user(self, user_id: str) -> List[FriendResponse]:
        # Pending incoming requests: friend_id = user_id. We join on user_id to get sender's profile.
        query = """
            SELECT f.*, p.username as friend_username, p.display_name as friend_display_name, p.avatar_url as friend_avatar_url
            FROM friends f
            JOIN profiles p ON f.user_id = p.id
            WHERE f.friend_id = $1 AND f.status = 'pending'
            ORDER BY f.created_at DESC
        """
        rows = await self.conn.fetch(query, UUID(user_id))
        return [FriendResponse(**dict(r)) for r in rows]
