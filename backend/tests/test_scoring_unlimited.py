import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import os
import asyncio
import asyncpg
from datetime import datetime, timezone

from app.main import app
from app.core.config import settings

def generate_test_token(user_id: str, role: str = "authenticated"):
    import jwt
    from datetime import timedelta
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    return jwt.encode(payload, secret, algorithm="HS256")

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

async def create_user_in_db(user_id: str):
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    await conn.execute("""
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', '{}', now(), now(), '', '', '', '')
        ON CONFLICT DO NOTHING
    """, user_id, f"{user_id}@example.com")
    await conn.close()

@pytest.fixture(scope="module")
def test_user_1():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id))
    return user_id

@pytest.fixture(scope="module")
def test_user_2():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id))
    return user_id

@pytest.fixture(scope="module")
def test_user_1_headers(test_user_1):
    return {"Authorization": f"Bearer {generate_test_token(test_user_1)}"}

@pytest.fixture(scope="module")
def test_user_2_headers(test_user_2):
    return {"Authorization": f"Bearer {generate_test_token(test_user_2)}"}

def test_unlimited_attempts_and_scoring(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    # 1. Create a custom arena
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
    arena = res.json()
    arena_id = arena["id"]

    # 2. Add second user
    idem_key2 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key2
    res = client.post(f"/arenas/{arena_id}/invites", json={"invitee_id": test_user_2}, headers=test_user_1_headers)
    assert res.status_code == 201
    invite_id = res.json()["id"]

    idem_key3 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_key3
    res = client.post(f"/invites/{invite_id}/respond", json={"accept": True}, headers=test_user_2_headers)
    assert res.status_code == 200

    # 3. Start arena
    idem_key4 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key4
    res = client.post(f"/api/v1/arenas/{arena_id}/start", headers=test_user_1_headers)
    assert res.status_code == 200

    # Get rounds
    res = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=test_user_1_headers)
    assert res.status_code == 200
    rounds = res.json()
    round_id = rounds[0]["id"]
    
    # We need the correct option. We can fetch it via db.
    async def get_correct_opt():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        row = await conn.fetchrow("SELECT correct_option FROM questions WHERE id = $1", rounds[0]["question_id"])
        await conn.close()
        return row["correct_option"]
        
    correct_option = asyncio.run(get_correct_opt())
    wrong_option = next(opt["id"] for opt in rounds[0]["question_options"] if opt["id"] != correct_option)

    # 4. Wrong answer -> retry
    idem_key_attempt = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key_attempt
    res = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": wrong_option, "response_ms": 1000},
        headers=test_user_1_headers
    )
    assert res.status_code == 200
    attempt1 = res.json()
    assert attempt1["is_correct"] is False
    assert attempt1["status"] == "in_progress"

    # Verify no DB row duplication (user should still have exactly 1 attempt row)
    async def count_attempts():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        rows = await conn.fetch("SELECT * FROM arena_attempts WHERE round_id = $1 AND user_id = $2", round_id, test_user_1)
        await conn.close()
        return len(rows)
    
    assert asyncio.run(count_attempts()) == 1

    # 5. Wrong -> Wrong -> Correct lifecycle
    idem_key_attempt2 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key_attempt2
    res = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": wrong_option, "response_ms": 2000},
        headers=test_user_1_headers
    )
    assert res.status_code == 200
    attempt2 = res.json()
    assert attempt2["is_correct"] is False

    idem_key_attempt3 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key_attempt3
    res = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": correct_option, "response_ms": 3000},
        headers=test_user_1_headers
    )
    assert res.status_code == 200
    attempt3 = res.json()
    assert attempt3["is_correct"] is True
    assert attempt3["status"] == "submitted"
    assert "points_awarded" in attempt3
    
    # Idempotency behavior
    res_idem = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": correct_option, "response_ms": 3000},
        headers=test_user_1_headers
    )
    assert res_idem.status_code == 200
    assert res_idem.json() == attempt3

    # 6. Score range (Base 100 + bonus up to 50)
    assert 100 <= attempt3["points_awarded"] <= 150

    # 7. Submission after already-correct attempt rejected
    idem_key_attempt4 = str(uuid4())
    test_user_1_headers["Idempotency-Key"] = idem_key_attempt4
    res = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": wrong_option, "response_ms": 4000},
        headers=test_user_1_headers
    )
    assert "terminal state" in res.json()["error"]["message"].lower()

    # 8. User 2 timeouts / submission after round expiry
    async def expire_round():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        await conn.execute("UPDATE arena_rounds SET ends_at = now() - interval '1 second' WHERE id = $1", round_id)
        await conn.close()
    
    asyncio.run(expire_round())
    
    idem_key_user2 = str(uuid4())
    test_user_2_headers["Idempotency-Key"] = idem_key_user2
    res = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts",
        json={"selected_option": correct_option, "response_ms": 1000},
        headers=test_user_2_headers
    )
    assert res.status_code == 409
    assert "expired" in res.json()["error"]["message"].lower()

    # Trigger manual advance (simulating background task)
    async def force_advance():
        from app.services.scoring_service import ScoringService
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        scoring_service = ScoringService(conn)
        await scoring_service.advance_round(arena_id, round_id)
        await conn.close()
        
    asyncio.run(force_advance())

    # 9. Round/Arena advancement after completion
    res = client.get(f"/api/v1/arenas/{arena_id}/results", headers=test_user_1_headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 2
    

