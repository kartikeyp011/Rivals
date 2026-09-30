import pytest
import asyncio
from uuid import uuid4
import asyncpg
from app.core.config import settings

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

def test_economy_insufficient_funds(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
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

    # Empty user 1 balance if they have any (force insufficient funds)
    async def clear_balance():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        from app.services.coin_service import CoinService
        from app.schemas.coin import CoinLedgerReason
        cs = CoinService(conn)
        bal = await cs.get_balance(test_user_1)
        if bal > 0:
            await cs.deduct_coins(test_user_1, bal, CoinLedgerReason.admin_adjustment)
        await conn.close()
        
    asyncio.run(clear_balance())

    # Try to create wager without funds
    wager_payload = {
        "arena_id": arena_id,
        "coin_amount": 50
    }
    idem_wager = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_wager
    res = client.post("/api/v1/wagers", json=wager_payload, headers=test_user_1_headers)
    assert res.status_code == 409
    assert "Insufficient coins" in res.json()["error"]["message"]

def test_wager_lifecycle_and_payout(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    # Fund users
    async def fund_users():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        from app.services.coin_service import CoinService
        from app.schemas.coin import CoinLedgerReason
        cs = CoinService(conn)
        await cs.add_coins(test_user_1, 1000, CoinLedgerReason.admin_adjustment)
        await cs.add_coins(test_user_2, 1000, CoinLedgerReason.admin_adjustment)
        
        b1 = await cs.get_balance(test_user_1)
        b2 = await cs.get_balance(test_user_2)
        await conn.close()
        return b1, b2
        
    b1_start, b2_start = asyncio.run(fund_users())

    # Make them friends
    async def make_friends():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
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

    # Invite and accept
    idem_key2 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key2
    res = client.post(f"/api/v1/arenas/{arena_id}/invites", json={"invitee_id": test_user_2}, headers=test_user_1_headers)
    invite_id = res.json()["id"]
    
    idem_key3 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_key3
    res = client.post(f"/api/v1/invites/{invite_id}/respond", json={"accept": True}, headers=test_user_2_headers)

    # Create Wager
    wager_payload = {
        "arena_id": arena_id,
        "coin_amount": 50
    }
    idem_wager = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_wager
    res = client.post("/api/v1/wagers", json=wager_payload, headers=test_user_1_headers)
    assert res.status_code == 201
    wager_id = res.json()["id"]

    # Check balance deducted
    async def get_b(uid):
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        from app.services.coin_service import CoinService
        cs = CoinService(conn)
        bal = await cs.get_balance(uid)
        await conn.close()
        return bal
    
    assert asyncio.run(get_b(test_user_1)) == b1_start - 50

    # User 2 accepts wager
    idem_wager_acc = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_wager_acc
    res = client.post(f"/api/v1/wagers/{wager_id}/accept", headers=test_user_2_headers)
    assert res.status_code == 200

    assert asyncio.run(get_b(test_user_2)) == b2_start - 50

    # Test idempotency (User 2 accepts again with same key)
    res_idem = client.post(f"/api/v1/wagers/{wager_id}/accept", headers=test_user_2_headers)
    assert res_idem.status_code == 200
    assert asyncio.run(get_b(test_user_2)) == b2_start - 50 # no extra deduction

    # Test duplicate prevention (User 2 accepts again with NEW key)
    idem_wager_acc2 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_wager_acc2
    res_dup = client.post(f"/api/v1/wagers/{wager_id}/accept", headers=test_user_2_headers)
    assert res_dup.status_code == 409
    assert "already joined" in res_dup.json()["error"]["message"]

    # Play arena
    idem_key4 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key4
    res = client.post(f"/api/v1/arenas/{arena_id}/start", headers=test_user_1_headers)
    
    # Get rounds and answer correctly for User 1, incorrectly for User 2 (so user 1 wins)
    res = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=test_user_1_headers)
    round_id = res.json()[0]["id"]
    
    async def get_correct_opt():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        row = await conn.fetchrow("SELECT correct_option FROM questions WHERE id = $1", res.json()[0]["question_id"])
        await conn.close()
        return row["correct_option"]
    
    correct_option = asyncio.run(get_correct_opt())
    wrong_option = next(opt["id"] for opt in res.json()[0]["question_options"] if opt["id"] != correct_option)
    
    idem_att1 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_att1
    client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": correct_option, "response_ms": 1000},
        headers=test_user_1_headers
    )
    
    idem_att2 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_att2
    client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": wrong_option, "response_ms": 1000},
        headers=test_user_2_headers
    )
    
    # Trigger advance manually
    async def force_advance():
        from app.services.scoring_service import ScoringService
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        scoring_service = ScoringService(conn)
        await scoring_service.advance_round(arena_id, round_id) # also triggers resolve_wager internally
        await conn.close()
        
    asyncio.run(force_advance())
    
    # Check wager resolution
    res_wager = client.get(f"/api/v1/wagers/{wager_id}", headers=test_user_1_headers)
    wager = res_wager.json()
    assert wager["status"] == "settled"
    
    # Check balances - User 1 should get 100 (50 returned + 50 profit)
    assert asyncio.run(get_b(test_user_1)) == b1_start + 50
    # User 2 gets 0 (lost their 50)
    assert asyncio.run(get_b(test_user_2)) == b2_start - 50

def test_wager_cancellation_refund(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    # Fund users
    async def fund_users():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        from app.services.coin_service import CoinService
        from app.schemas.coin import CoinLedgerReason
        cs = CoinService(conn)
        await cs.add_coins(test_user_1, 1000, CoinLedgerReason.admin_adjustment)
        await cs.add_coins(test_user_2, 1000, CoinLedgerReason.admin_adjustment)
        b1 = await cs.get_balance(test_user_1)
        b2 = await cs.get_balance(test_user_2)
        await conn.close()
        return b1, b2
        
    b1_start, b2_start = asyncio.run(fund_users())

    # Make them friends
    async def make_friends():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
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
    arena_id = res.json()["id"]

    # Invite and accept
    idem_key2 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key2
    res = client.post(f"/api/v1/arenas/{arena_id}/invites", json={"invitee_id": test_user_2}, headers=test_user_1_headers)
    invite_id = res.json()["id"]
    
    idem_key3 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_key3
    res = client.post(f"/api/v1/invites/{invite_id}/respond", json={"accept": True}, headers=test_user_2_headers)

    # Create Wager
    wager_payload = {
        "arena_id": arena_id,
        "coin_amount": 50
    }
    idem_wager = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_wager
    res = client.post("/api/v1/wagers", json=wager_payload, headers=test_user_1_headers)
    wager_id = res.json()["id"]

    # User 2 accepts wager
    idem_wager_acc = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_wager_acc
    client.post(f"/api/v1/wagers/{wager_id}/accept", headers=test_user_2_headers)

    # Cancel arena
    idem_cancel = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_cancel
    res = client.post(f"/api/v1/arenas/{arena_id}/cancel", headers=test_user_1_headers)
    assert res.status_code == 200

    # Wager should be voided and refunded
    res_wager = client.get(f"/api/v1/wagers/{wager_id}", headers=test_user_1_headers)
    assert res_wager.json()["status"] == "voided"

    # Check balances - Both should be fully refunded to original
    async def get_b(uid):
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        from app.services.coin_service import CoinService
        cs = CoinService(conn)
        bal = await cs.get_balance(uid)
        await conn.close()
        return bal

    assert asyncio.run(get_b(test_user_1)) == b1_start
    assert asyncio.run(get_b(test_user_2)) == b2_start
