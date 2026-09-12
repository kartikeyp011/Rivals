from typing import List
from uuid import UUID
from asyncpg import Connection

from app.schemas.friend import FriendResponse, FriendRequestCreate, FriendStatus
from app.repositories.friend_repository import FriendRepository
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class FriendService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = FriendRepository(conn)

    async def send_friend_request(self, user_id: str, data: FriendRequestCreate) -> FriendResponse:
        if user_id == str(data.friend_id):
            raise ConflictError("Cannot send a friend request to yourself")
            
        async with self.conn.transaction():
            return await self.repo.create_friend_request(user_id, str(data.friend_id))

    async def get_accepted_friends(self, user_id: str) -> List[FriendResponse]:
        return await self.repo.get_friends_by_status(user_id, FriendStatus.accepted)

    async def get_pending_requests(self, user_id: str) -> List[FriendResponse]:
        return await self.repo.get_pending_requests_for_user(user_id)

    async def respond_to_request(self, request_id: UUID, user_id: str, accept: bool) -> FriendResponse:
        async with self.conn.transaction():
            request = await self.repo.get_friendship_by_id(request_id)
            if not request:
                raise NotFoundError("Friend request not found")
                
            if str(request['friend_id']) != user_id:
                raise ForbiddenError("You can only respond to requests sent to you")
                
            if request['status'] != 'pending':
                raise ConflictError(f"Request is already {request['status']}")
                
            new_status = FriendStatus.accepted if accept else FriendStatus.rejected
            await self.repo.update_friend_status(request_id, new_status)
            
            if accept:
                await self.repo.insert_reciprocal_friend(user_id, str(request['user_id']))
                
            return await self.repo.get_friendship(str(request['user_id']), user_id)

    async def delete_friendship(self, friend_id: UUID, user_id: str) -> None:
        async with self.conn.transaction():
            await self.repo.delete_friendship(user_id, str(friend_id))
