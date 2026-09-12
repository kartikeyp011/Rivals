from typing import List, Optional
from uuid import UUID
from asyncpg import Connection

from app.schemas.wager import WagerCreate, WagerResponse, WagerStatus
from app.repositories.wager_repository import WagerRepository
from app.repositories.arena_repository import ArenaRepository
from app.repositories.score_repository import ScoreRepository
from app.repositories.friend_repository import FriendRepository
from app.services.coin_service import CoinService
from app.schemas.coin import CoinLedgerReason
from app.core.errors import NotFoundError, ForbiddenError, ConflictError

class WagerService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.wager_repo = WagerRepository(conn)
        self.arena_repo = ArenaRepository(conn)
        self.score_repo = ScoreRepository(conn)
        self.friend_repo = FriendRepository(conn)
        self.coin_service = CoinService(conn)

    async def get_wager(self, wager_id: UUID) -> WagerResponse:
        wager = await self.wager_repo.get_wager(wager_id)
        if not wager:
            raise NotFoundError("Wager not found")
        return wager

    async def get_wagers_for_user(self, user_id: str) -> List[WagerResponse]:
        return await self.wager_repo.get_wagers_for_user(user_id)

    async def create_wager(self, user_id: str, data: WagerCreate) -> WagerResponse:
        if data.coin_amount not in (10, 25, 50):
            raise ConflictError("Valid stakes are 10, 25, or 50 coins")

        # Must be tied to an arena
        arena = await self.arena_repo.get_arena(data.arena_id)
        if not arena:
            raise NotFoundError("Arena not found")
        if arena.status != 'pending':
            raise ConflictError("Wagers can only be created for pending arenas")

        async with self.conn.transaction():
            # Check if wager already exists for arena
            existing = await self.wager_repo.get_wager_by_arena(data.arena_id)
            if existing:
                raise ConflictError("A wager already exists for this arena")

            # Deduct coins FIRST
            await self.coin_service.deduct_coins(
                user_id=user_id,
                amount=data.coin_amount,
                reason=CoinLedgerReason.arena_wager_placed,
                reference_id=data.arena_id,
                reference_table='arenas'
            )

            # Create wager
            wager = await self.wager_repo.create_wager(data.arena_id, user_id, data.coin_amount)

            # Add creator as participant
            await self.wager_repo.add_participant(wager.id, user_id, data.coin_amount)
            await self.wager_repo.update_total_pot(wager.id, data.coin_amount)

            return await self.wager_repo.get_wager(wager.id)

    async def accept_wager(self, wager_id: UUID, user_id: str) -> WagerResponse:
        async with self.conn.transaction():
            # Lock wager to prevent concurrent resolution/cancellation
            row = await self.conn.fetchrow("SELECT status FROM wagers WHERE id = $1 FOR UPDATE", wager_id)
            if not row:
                raise NotFoundError("Wager not found")
            
            wager = await self.wager_repo.get_wager(wager_id)
            if wager.status != 'open':
                raise ConflictError(f"Wager cannot be accepted in its current state ({wager.status})")

            # Check if already joined
            participant = await self.wager_repo.get_participant(wager_id, user_id)
            if participant:
                raise ConflictError("You have already joined this wager")

            # Check friendship with creator
            if str(wager.created_by) != user_id:
                from app.schemas.friend import FriendStatus
                friends = await self.friend_repo.get_friends_by_status(str(wager.created_by), FriendStatus.accepted)
                friend_ids = [str(f.friend_id) for f in friends]
                if user_id not in friend_ids:
                    raise ForbiddenError("You must be an accepted friend of the wager creator to join")

            # Deduct coins
            await self.coin_service.deduct_coins(
                user_id=user_id,
                amount=wager.coin_amount,
                reason=CoinLedgerReason.arena_wager_placed,
                reference_id=wager.arena_id,
                reference_table='arenas'
            )

            # Add participant
            await self.wager_repo.add_participant(wager_id, user_id, wager.coin_amount)
            await self.wager_repo.update_total_pot(wager_id, wager.coin_amount)

            return await self.wager_repo.get_wager(wager_id)

    async def decline_wager(self, wager_id: UUID, user_id: str):
        # We do not track declines in DB to avoid unnecessary schema migrations.
        # Just verify wager exists.
        wager = await self.wager_repo.get_wager(wager_id)
        if not wager:
            raise NotFoundError("Wager not found")
        return {"status": "declined"}

    async def resolve_wager(self, arena_id: UUID):
        # Called at the end of complete_arena, OR if arena is cancelled.
        async with self.conn.transaction():
            # Lock the wager
            row = await self.conn.fetchrow(
                "SELECT id, status, coin_amount, total_pot FROM wagers WHERE arena_id = $1 FOR UPDATE", 
                arena_id
            )
            if not row:
                return # No wager for this arena
                
            wager_id = row['id']
            status = row['status']
            
            if status in ('settled', 'voided'):
                return # Already resolved
                
            # If we reach here, transition from open/locked to settled/voided
            arena = await self.arena_repo.get_arena(arena_id)
            participants = await self.conn.fetch("SELECT * FROM wager_participants WHERE wager_id = $1", wager_id)
            
            if arena.status == 'cancelled':
                await self._refund_all(wager_id, participants, "Arena was cancelled")
                return
                
            # Arena is completed. We need final scores.
            if len(participants) < 2:
                # Wager didn't meet minimum requirements, refund
                await self._refund_all(wager_id, participants, "Not enough participants")
                return
                
            if len(participants) < 3 and arena.max_participants > 2: # Multi-friend wager
                 # Wait, technical spec: "1v1: 2 participants. Multi-friend: 3 or more accepted." 
                 pass # We will just handle it based on participant count.
                 
            # Retrieve final scores
            scores = await self.score_repo.get_scores_for_arena(arena_id)
            score_dict = {str(s.user_id): s.total_points for s in scores}
            
            # Everyone who accepted the wager MUST have a score (even if 0). 
            # If they forfeited/timed out, their score is 0 or whatever they got.
            
            part_scores = []
            for p in participants:
                uid = str(p['user_id'])
                part_scores.append({
                    'user_id': uid,
                    'score': score_dict.get(uid, 0),
                    'coin_amount': p['coin_amount']
                })
                
            # Sort by score descending
            part_scores.sort(key=lambda x: x['score'], reverse=True)
            
            # Check for ties affecting payouts
            # In 1v1 (2 players), tie for 1st is a tie affecting payout.
            # In 3+ players, tie for 1st OR tie for 2nd affects payout.
            if len(part_scores) == 2:
                if part_scores[0]['score'] == part_scores[1]['score']:
                    # Tie
                    await self._refund_all(wager_id, participants, "Tie")
                    return
                # Winner takes all
                winner = part_scores[0]
                pot = sum(p['coin_amount'] for p in part_scores)
                await self._payout(wager_id, winner['user_id'], pot)
                
            else:
                # 3 or more players
                if part_scores[0]['score'] == part_scores[1]['score']:
                    # Tie for first
                    await self._refund_all(wager_id, participants, "Tie for first")
                    return
                if part_scores[1]['score'] == part_scores[2]['score']:
                    # Tie for second
                    await self._refund_all(wager_id, participants, "Tie for second")
                    return
                    
                # 1st gets pot - 2nd place's stake
                # 2nd gets their stake back
                first = part_scores[0]
                second = part_scores[1]
                pot = sum(p['coin_amount'] for p in part_scores)
                
                second_payout = second['coin_amount']
                first_payout = pot - second_payout
                
                await self._payout(wager_id, second['user_id'], second_payout)
                await self._payout(wager_id, first['user_id'], first_payout)
                
            # Mark wager as settled
            await self.conn.execute("UPDATE wagers SET status = 'settled', settled_at = now() WHERE id = $1", wager_id)
            
    async def _refund_all(self, wager_id: UUID, participants: List[dict], reason: str):
        for p in participants:
            await self._payout(wager_id, str(p['user_id']), p['coin_amount'], is_refund=True)
        await self.conn.execute("UPDATE wagers SET status = 'voided', settled_at = now() WHERE id = $1", wager_id)
        
    async def _payout(self, wager_id: UUID, user_id: str, amount: int, is_refund: bool = False):
        if amount <= 0:
            return
            
        reason = CoinLedgerReason.arena_wager_refund if is_refund else CoinLedgerReason.arena_wager_won
        await self.coin_service.add_coins(
            user_id=user_id,
            amount=amount,
            reason=reason,
            reference_id=wager_id,
            reference_table='wagers'
        )
        await self.wager_repo.update_participant_winnings(wager_id, UUID(user_id), amount)
