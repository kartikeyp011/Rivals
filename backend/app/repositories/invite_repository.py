from typing import Optional, List
from uuid import UUID
from .base import BaseRepository
from app.schemas.invite import InviteResponse

class InviteRepository(BaseRepository):
    async def create_invite(self, arena_id: UUID, inviter_id: str, invitee_id: str) -> InviteResponse:
        row = await self.conn.fetchrow(
            """
            INSERT INTO arena_invites (arena_id, inviter_id, invitee_id)
            VALUES ($1, $2, $3)
            RETURNING *
            """,
            str(arena_id), inviter_id, invitee_id
        )
        return InviteResponse(**dict(row))

    async def get_invite(self, invite_id: UUID) -> Optional[InviteResponse]:
        row = await self.conn.fetchrow(
            "SELECT * FROM arena_invites WHERE id = $1",
            str(invite_id)
        )
        if row:
            return InviteResponse(**dict(row))
        return None

    async def update_invite_status(self, invite_id: UUID, status: str) -> Optional[InviteResponse]:
        row = await self.conn.fetchrow(
            """
            UPDATE arena_invites
            SET status = $2, responded_at = now()
            WHERE id = $1
            RETURNING *
            """,
            str(invite_id), status
        )
        if row:
            return InviteResponse(**dict(row))
        return None

    async def get_invites_for_user(self, user_id: str) -> List[InviteResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_invites
            WHERE invitee_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )
        return [InviteResponse(**dict(r)) for r in rows]

    async def get_invites_for_arena(self, arena_id: UUID) -> List[InviteResponse]:
        rows = await self.conn.fetch(
            """
            SELECT * FROM arena_invites
            WHERE arena_id = $1
            ORDER BY created_at DESC
            """,
            str(arena_id)
        )
        return [InviteResponse(**dict(r)) for r in rows]
