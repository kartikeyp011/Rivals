import pytest
import asyncio
from uuid import uuid4
import asyncpg
from app.core.config import settings
from unittest.mock import patch

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

def test_wager_resolution_failure_rolls_back_arena_status(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    # Fund users
    async def fund_users():
        conn = await asyncpg.connect(settings.DATABASE_URL)
        from app.services.coin_service import CoinService
        from app.schemas.coin import CoinLedgerReason
        cs = CoinService(conn)
        await cs.add_coins(test_user_1, 1000, CoinLedgerReason.admin_adjustment)
        await cs.add_coins(test_user_2, 1000, CoinLedgerReason.admin_adjustment)
        await conn.close()
        
    asyncio.run(fund_users())

    # Make them friends
    async def make_friends():
        conn = await asyncpg.connect(settings.DATABASE_URL)
        from app.repositories.friend_repository import FriendRepository
        repo = FriendRepository(conn)
        try:
            await repo.create_friend_request(test_user_1, test_user_2)
        except Exception:
            pass
        await repo.insert_reciprocal_friend(test_user_1, test_user_2)
        await repo.insert_reciprocal_friend(test_user_2, test_user_1)
        await conn.close()
    
    asyncio.run(make_friends())

    # Create arena
    arena_payload = {
        "max_participants": 2,
        "max_rounds": 1,
        "time_limit_seconds": 30,
        "difficulty": "easy"
    }
    idem_key = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key
    res = client.post("/api/v1/arenas", json=arena_payload, headers=test_user_1_headers)
    assert res.status_code == 201
    arena_id = res.json()["id"]

    # Create Wager
    wager_payload = {
        "arena_id": arena_id,
        "coin_amount": 10
    }
    idem_wager = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_wager
    res = client.post("/api/v1/wagers", json=wager_payload, headers=test_user_1_headers)
    assert res.status_code == 201
    
    # Mock resolve_wager to fail
    with patch('app.services.wager_service.WagerService.resolve_wager', side_effect=Exception("Simulated wager resolution failure")):
        # Attempt to cancel arena, which should trigger resolve_wager
        idem_cancel = str(uuid4())
        test_user_1_headers["Idempotency-Key"] = idem_cancel
        with pytest.raises(Exception, match="Simulated wager resolution failure"):
            client.post(f"/api/v1/arenas/{arena_id}/cancel", headers=test_user_1_headers)
        
    # Verify arena is NOT cancelled because transaction rolled back
    res_arena = client.get(f"/api/v1/arenas/{arena_id}", headers=test_user_1_headers)
    assert res_arena.json()["status"] == "pending"
    
    # Now verify complete_arena rolls back too
    # First invite user 2
    idem_invite = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_invite
    res = client.post(f"/arenas/{arena_id}/invites", json={"invitee_id": test_user_2}, headers=test_user_1_headers)
    invite_id = res.json()["id"]
    
    idem_acc = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_acc
    client.post(f"/invites/{invite_id}/respond", json={"accept": True}, headers=test_user_2_headers)
    
    # Start arena
    idem_start = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_start
    client.post(f"/api/v1/arenas/{arena_id}/start", headers=test_user_1_headers)
    
    # Advance round to finish arena, which triggers complete_arena -> resolve_wager
    res = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=test_user_1_headers)
    round_id = res.json()[0]["id"]
    
    with patch('app.services.wager_service.WagerService.resolve_wager', side_effect=Exception("Simulated wager resolution failure 2")):
        # Manually advance the round
        async def force_advance():
            from app.services.scoring_service import ScoringService
            conn = await asyncpg.connect(settings.DATABASE_URL)
            scoring_service = ScoringService(conn)
            try:
                await scoring_service.advance_round(arena_id, round_id)
            except Exception as e:
                assert "Simulated wager resolution failure 2" in str(e)
            await conn.close()
            
        asyncio.run(force_advance())
        
    # Verify arena is NOT completed
    res_arena = client.get(f"/api/v1/arenas/{arena_id}", headers=test_user_1_headers)
    assert res_arena.json()["status"] == "active"
