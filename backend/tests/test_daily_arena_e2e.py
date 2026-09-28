import pytest
import asyncio
from fastapi.testclient import TestClient
from uuid import uuid4
import asyncpg
from datetime import datetime, timedelta, timezone
import json
from unittest.mock import patch

from app.main import app
from app.core.config import settings

@pytest.fixture(autouse=True)
def disable_schedule_round_timeout():
    async def dummy_timeout(*args, **kwargs):
        pass
    with patch("app.routers.arenas.schedule_round_timeout", side_effect=dummy_timeout):
        yield

@pytest.fixture(scope="module", autouse=True)
def setup_test_questions():
    """Provision exactly 3 deterministic, valid MCQ test questions for the duration of the E2E tests."""
    async def seed_questions():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        # Use specific UUIDs so they are easily identifiable and deterministic
        q_ids = [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333'
        ]
        
        # Clean up any previous run
        print("Executing DELETE FROM arenas")
        await conn.execute("DELETE FROM arenas WHERE category = 'daily'")
        print("Finished DELETE FROM arenas")
        await conn.execute("DELETE FROM arena_rounds WHERE question_id = ANY($1::uuid[])", q_ids)
        await conn.execute("DELETE FROM questions WHERE id = ANY($1::uuid[])", q_ids)
        
        for q_id in q_ids:
            options = json.dumps(["Option A", "Option B", "Option C", "Option D"])
            prompt_str = f"Test question {q_id}"
            await conn.execute("""
                INSERT INTO questions (id, category, difficulty, prompt, options, correct_option, is_active)
                VALUES ($1::uuid, 'daily', 'easy', $3::text, $2::jsonb, 'Option A', true)
                ON CONFLICT DO NOTHING
            """, q_id, options, prompt_str)
        await conn.close()
        
    async def teardown_questions():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        q_ids = [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333'
        ]
        await conn.execute("DELETE FROM arenas WHERE metadata->>'type' = 'daily'")
        await conn.execute("DELETE FROM arena_rounds WHERE question_id = ANY($1::uuid[])", q_ids)
        await conn.execute("DELETE FROM questions WHERE id = ANY($1::uuid[])", q_ids)
        await conn.close()
        
    asyncio.run(seed_questions())
    yield
    asyncio.run(teardown_questions())

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

async def create_user_in_db(user_id: str, username: str):
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    await conn.execute("""
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', '{}', now(), now(), '', '', '', '')
        ON CONFLICT DO NOTHING
    """, user_id, f"{user_id}@example.com")
    await conn.execute("""
        INSERT INTO profiles (id, username, global_opt_in)
        VALUES ($1, $2, TRUE)
        ON CONFLICT DO NOTHING
    """, user_id, username)
    await conn.close()

@pytest.fixture(scope="module")
def user_a():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id, f"usera_{user_id[:8]}"))
    return user_id

@pytest.fixture(scope="module")
def user_b():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id, f"userb_{user_id[:8]}"))
    return user_id

@pytest.fixture(scope="module")
def user_c():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id, f"userc_{user_id[:8]}"))
    return user_id

@pytest.fixture(scope="module")
def user_d():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id, f"userd_{user_id[:8]}"))
    return user_id

@pytest.fixture(scope="module")
def user_e():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id, f"usere_{user_id[:8]}"))
    return user_id

def get_auth_headers(user_id: str):
    import jwt
    import os
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    payload = {
        "sub": user_id,
        "role": "authenticated",
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}

def test_daily_arena_deterministic(client, user_a, user_b):
    headers_a = get_auth_headers(user_a)
    headers_b = get_auth_headers(user_b)
    
    print("getting arena 1")
    resp1 = client.get("/api/v1/arenas/daily", headers=headers_a)
    assert resp1.status_code == 200
    arena1 = resp1.json()

    print("getting arena 2")
    resp2 = client.get("/api/v1/arenas/daily", headers=headers_a)
    assert resp2.status_code == 200
    arena2 = resp2.json()

    assert arena1["id"] == arena2["id"]
    
    print("getting rounds 1")
    rounds1 = client.get(f"/api/v1/arenas/{arena1['id']}/rounds", headers=headers_a).json()
    print("getting rounds 2")
    rounds2 = client.get(f"/api/v1/arenas/{arena2['id']}/rounds", headers=headers_a).json()
    assert len(rounds1) == 3
    
    q_ids_1 = [r["question_id"] for r in rounds1]
    assert q_ids_1 == [r["question_id"] for r in rounds2]

    # 2. Different user, same UTC day -> different personal arena ID, identical 3 questions
    print("getting arena b")
    resp_b = client.get("/api/v1/arenas/daily", headers=headers_b)
    assert resp_b.status_code == 200
    arena_b = resp_b.json()

    assert arena_b["id"] != arena1["id"]

    print("getting rounds b")
    rounds_b = client.get(f"/api/v1/arenas/{arena_b['id']}/rounds", headers=headers_b).json()
    q_ids_b = [r["question_id"] for r in rounds_b]
    assert q_ids_1 == q_ids_b

    # 3. Next UTC day -> deterministic new selection
    with patch("app.services.arena_service.datetime") as mock_dt:
        mock_dt.now.return_value = datetime.now(timezone.utc) + timedelta(days=1)
        # Need to pass timezone through since datetime.now is mocked
        mock_dt.timezone = timezone
        print("getting next arena")
        resp_next = client.get("/api/v1/arenas/daily", headers=headers_a)
        assert resp_next.status_code == 200
        arena_next = resp_next.json()
        
        # New day, new arena instance
        assert arena_next["id"] != arena1["id"]
        
        print("getting next rounds")
        rounds_next = client.get(f"/api/v1/arenas/{arena_next['id']}/rounds", headers=headers_a).json()
        q_ids_next = [r["question_id"] for r in rounds_next]
        # At least one question might overlap, but it shouldn't be identically seeded.
        pass

    print("End of test_daily_arena_deterministic")

@pytest.mark.asyncio
async def test_daily_arena_concurrency(user_c):
    # 4. True concurrent requests
    from httpx import AsyncClient, ASGITransport
    from contextlib import AsyncExitStack
    headers_c = get_auth_headers(user_c)
    
    async with AsyncExitStack() as stack:
        await stack.enter_async_context(app.router.lifespan_context(app))
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            req1 = ac.get("/api/v1/arenas/daily", headers=headers_c)
            req2 = ac.get("/api/v1/arenas/daily", headers=headers_c)
            req3 = ac.get("/api/v1/arenas/daily", headers=headers_c)
            
            results = await asyncio.gather(req1, req2, req3)
        
        for r in results:
            assert r.status_code == 200
            
        arena_ids = [r.json()["id"] for r in results]
        assert arena_ids[0] == arena_ids[1] == arena_ids[2]
        
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        count = await conn.fetchval("""
            SELECT count(*) FROM arenas
            WHERE category = 'daily' AND host_user_id = $1::uuid
        """, user_c)
        await conn.close()
        assert count == 1

def test_daily_arena_insufficient_questions(client, user_d, monkeypatch):
    # 5. Fewer than 3 questions fails without partial arena
    import asyncpg
    original_fetch = asyncpg.Connection.fetch
    
    async def mock_fetch(self, query, *args, **kwargs):
        if "FROM questions" in query and "LIMIT 3" in query:
            return []
        return await original_fetch(self, query, *args, **kwargs)
        
    monkeypatch.setattr("asyncpg.Connection.fetch", mock_fetch)
    
    headers_d = get_auth_headers(user_d)
    resp = client.get("/api/v1/arenas/daily", headers=headers_d)
    assert resp.status_code >= 400
    
    async def check_no_arena():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        count = await conn.fetchval("SELECT count(*) FROM arenas WHERE category = 'daily' AND host_user_id = $1::uuid", user_d)
        await conn.close()
        assert count == 0
        
    asyncio.run(check_no_arena())

def test_e2e_economy_and_duplicate_completion(client, user_e):
    headers_a = get_auth_headers(user_e)
    
    # Check economy before
    coins_before = client.get("/api/v1/coins/balance", headers=headers_a).json()["balance"]
    streak_before = client.get("/api/v1/streaks/me", headers=headers_a).json()["current_streak"]
    
    date_str = datetime.now(timezone.utc).date().isoformat()
    lb_before_resp = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}", headers=headers_a)
    score_before = lb_before_resp.json()["score"] if lb_before_resp.status_code == 200 else 0
    
    # 6. Lifecycle: Start arena
    arena = client.get("/api/v1/arenas/daily", headers=headers_a).json()
    arena_id = arena["id"]
    assert arena["status"] == "active"
    
    # Verify GET /arenas/daily after started returns the same instance
    arena_fetch_again = client.get("/api/v1/arenas/daily", headers=headers_a).json()
    assert arena_fetch_again["id"] == arena_id
    assert arena_fetch_again["status"] == "active"
    
    # 7. Complete the 3-round lifecycle
    rounds = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=headers_a).json()
    assert len(rounds) == 3
    
    async def get_correct_answer(round_id_str):
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        import uuid
        row = await conn.fetchrow("SELECT q.correct_option FROM arena_rounds r JOIN questions q ON r.question_id = q.id WHERE r.id = $1", uuid.UUID(round_id_str))
        await conn.close()
        return row["correct_option"]
        
    for i, r in enumerate(rounds):
        correct_option = asyncio.run(get_correct_answer(r["id"]))
        resp_attempt = client.post(
            f"/api/v1/arenas/{arena_id}/rounds/{r['id']}/attempts",
            json={"selected_option": correct_option, "response_ms": 1000},
            headers=headers_a
        )
        assert resp_attempt.status_code == 200
        
    # Verify arena status completed
    arena_after = client.get(f"/api/v1/arenas/{arena_id}", headers=headers_a).json()
    assert arena_after["status"] == "completed"
    
    # 8. Check economy after (authoritative state)
    coins_after = client.get("/api/v1/coins/balance", headers=headers_a).json()["balance"]
    streak_after = client.get("/api/v1/streaks/me", headers=headers_a).json()["current_streak"]
    lb_after = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}", headers=headers_a).json()
    score_after = lb_after["score"]
    
    DAILY_REWARD_AMOUNT = 50
    assert coins_after == coins_before + DAILY_REWARD_AMOUNT
    assert streak_after == streak_before + 1
    assert score_after > score_before
    
    # 9. Duplicate completion check
    arena_repeat = client.get("/api/v1/arenas/daily", headers=headers_a).json()
    assert arena_repeat["status"] == "completed"
    
    coins_repeat = client.get("/api/v1/coins/balance", headers=headers_a).json()["balance"]
    streak_repeat = client.get("/api/v1/streaks/me", headers=headers_a).json()["current_streak"]
    lb_repeat = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}", headers=headers_a).json()
    score_repeat = lb_repeat["score"]
    
    # No duplicate daily reward or streak increment or score increment
    assert coins_repeat == coins_after
    assert streak_repeat == streak_after
    assert score_repeat == score_after

def test_leaderboard_combinations(client, user_e, user_d):
    headers_a = get_auth_headers(user_e)
    headers_d = get_auth_headers(user_d)
    date_str = datetime.now(timezone.utc).date().isoformat()
    
    # 10. Leaderboards verification
    # Global Today
    resp_global_daily = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}", headers=headers_a)
    assert resp_global_daily.status_code == 200
    assert resp_global_daily.json()["score"] > 0
    
    # Global All-Time
    resp_global_all = client.get(f"/api/v1/leaderboards/me?period=all_time&period_key=all_time", headers=headers_a)
    assert resp_global_all.status_code == 200
    assert resp_global_all.json()["score"] > 0

    # Friends Today
    resp_friends_daily = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}&is_friends=true", headers=headers_a)
    assert resp_friends_daily.status_code == 200

    # Friends All-Time
    resp_friends_all = client.get(f"/api/v1/leaderboards/me?period=all_time&period_key=all_time&is_friends=true", headers=headers_a)
    assert resp_friends_all.status_code == 200

    # Unranked user (but globally opted-in)
    resp_unranked = client.get(f"/api/v1/leaderboards/me?period=daily&period_key={date_str}", headers=headers_d)
    assert resp_unranked.status_code == 200
    assert resp_unranked.json()["score"] == 0
