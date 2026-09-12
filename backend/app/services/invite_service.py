from typing import Optional, List
from uuid import UUID
from asyncpg import Connection
from datetime import datetime, timezone

from app.schemas.invite import InviteCreate, InviteResponse
from app.repositories.invite_repository import InviteRepository
from app.repositories.arena_repository import ArenaRepository
from app.repositories.participant_repository import ParticipantRepository
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class InviteService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.invite_repo = InviteRepository(conn)
        self.arena_repo = ArenaRepository(conn)
        self.participant_repo = ParticipantRepository(conn)

    async def create_invite(self, arena_id: UUID, inviter_id: str, data: InviteCreate) -> InviteResponse:
        arena = await self.arena_repo.get_arena(arena_id)
        if not arena:
            raise NotFoundError("Arena not found")

        if arena.host_user_id != UUID(inviter_id):
            raise ForbiddenError("Only the host can invite participants")

        if arena.status != 'pending':
            raise ConflictError("Cannot invite to an arena that has already started or been cancelled")
            
        participants = await self.participant_repo.get_participants_for_arena(arena_id)
        if len(participants) >= arena.max_participants:
            raise ConflictError("Arena has reached maximum participants")

        # Check if already participating or invited
        existing = await self.participant_repo.get_participant(arena_id, str(data.invitee_id))
        if existing:
            raise ConflictError("User is already a participant or invited")

        async with self.conn.transaction():
            invite = await self.invite_repo.create_invite(arena_id, inviter_id, str(data.invitee_id))
            return invite

    async def get_invites_for_user(self, user_id: str) -> List[InviteResponse]:
        return await self.invite_repo.get_invites_for_user(user_id)

    async def respond_to_invite(self, invite_id: UUID, user_id: str, accept: bool) -> InviteResponse:
        invite = await self.invite_repo.get_invite(invite_id)
        if not invite:
            raise NotFoundError("Invite not found")

        if invite.invitee_id != UUID(user_id):
            raise ForbiddenError("Not authorized to respond to this invite")

        if invite.status != 'pending':
            raise ConflictError("Invite is no longer pending")

        # Check expiration
        if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await self.invite_repo.update_invite_status(invite_id, 'expired')
            raise ConflictError("Invite has expired")

        async with self.conn.transaction():
            status = 'accepted' if accept else 'declined'
            updated_invite = await self.invite_repo.update_invite_status(invite_id, status)
            
            if accept:
                # Add participant
                arena = await self.arena_repo.get_arena(invite.arena_id)
                participants = await self.participant_repo.get_participants_for_arena(invite.arena_id)
                if len(participants) >= arena.max_participants:
                    raise ConflictError("Arena has reached maximum participants")
                
                await self.participant_repo.create_participant(invite.arena_id, user_id, 'active')
                
            return updated_invite
