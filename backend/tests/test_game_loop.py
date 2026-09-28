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
def auth_headers_1(test_user_1):
    return {"Authorization": f"Bearer {generate_test_token(test_user_1)}"}

@pytest.fixture(scope="module")
def auth_headers_2(test_user_2):
    return {"Authorization": f"Bearer {generate_test_token(test_user_2)}"}

def test_game_loop_full(client, test_user_1, test_user_2, auth_headers_1, auth_headers_2):
    # 1. Create Arena
    idem_key = str(uuid4())
    payload = {"max_rounds": 1}
    headers1 = {**auth_headers_1, "Idempotency-Key": idem_key}
    
    resp_create = client.post("/api/v1/arenas", json=payload, headers=headers1)
    assert resp_create.status_code == 201
    arena_id = resp_create.json()["id"]

    # 2. Invite User 2
    idem_invite = str(uuid4())
    resp_invite = client.post(f"/arenas/{arena_id}/invites", json={"invitee_id": test_user_2}, headers={**auth_headers_1, "Idempotency-Key": idem_invite})
    assert resp_invite.status_code == 201
    invite_id = resp_invite.json()["id"]

    # 3. User 2 accepts invite
    idem_accept = str(uuid4())
    resp_accept = client.post(f"/invites/{invite_id}/respond", json={"accept": True}, headers={**auth_headers_2, "Idempotency-Key": idem_accept})
    assert resp_accept.status_code == 200

    # 4. Start Arena (User 1)
    idem_start = str(uuid4())
    resp_start = client.post(f"/api/v1/arenas/{arena_id}/start", headers={**auth_headers_1, "Idempotency-Key": idem_start})
    assert resp_start.status_code == 200

    # 5. Get rounds
    resp_rounds = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=auth_headers_1)
    assert resp_rounds.status_code == 200
    rounds = resp_rounds.json()
    assert len(rounds) == 1
    round_id = rounds[0]["id"]
    assert rounds[0]["status"] == "active"
    assert rounds[0]["ends_at"] is not None

    # 6. Fetch attempts (they should be pre-created)
    resp_attempts = client.get(f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts", headers=auth_headers_1)
    assert resp_attempts.status_code == 200
    attempts = resp_attempts.json()
    assert len(attempts) == 2
    for a in attempts:
        assert a["status"] == "in_progress"

    # We need to know the correct answer to simulate a correct submission.
    # Since we can't get it from the API (it's safe), we'll query DB directly in the test.
    async def get_correct_answer():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        row = await conn.fetchrow(
            "SELECT q.correct_option FROM arena_rounds r JOIN questions q ON r.question_id = q.id WHERE r.id = $1", 
            round_id
        )
        await conn.close()
        return row["correct_option"]

    correct_option = asyncio.run(get_correct_answer())
    incorrect_option = "wrong_answer" if correct_option != "wrong_answer" else "other_wrong"

    # 7. User 2 submits wrong answer
    idem_submit_wrong = str(uuid4())
    resp_submit_wrong = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts", 
        json={"selected_option": incorrect_option, "response_ms": 1000},
        headers={**auth_headers_2, "Idempotency-Key": idem_submit_wrong}
    )
    assert resp_submit_wrong.status_code == 200
    assert resp_submit_wrong.json()["is_correct"] is False
    assert resp_submit_wrong.json()["status"] == "in_progress"

    # 8. User 2 submits correct answer
    idem_submit_correct_2 = str(uuid4())
    resp_submit_correct_2 = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts", 
        json={"selected_option": correct_option, "response_ms": 1500},
        headers={**auth_headers_2, "Idempotency-Key": idem_submit_correct_2}
    )
    assert resp_submit_correct_2.status_code == 200
    assert resp_submit_correct_2.json()["is_correct"] is True
    assert resp_submit_correct_2.json()["status"] == "submitted"

    # 9. User 1 submits correct answer
    idem_submit_correct_1 = str(uuid4())
    resp_submit_correct_1 = client.post(
        f"/api/v1/arenas/{arena_id}/rounds/{round_id}/attempts", 
        json={"selected_option": correct_option, "response_ms": 500},
        headers={**auth_headers_1, "Idempotency-Key": idem_submit_correct_1}
    )
    assert resp_submit_correct_1.status_code == 200
    assert resp_submit_correct_1.json()["is_correct"] is True

    # 10. Check if round and arena completed
    resp_arena = client.get(f"/api/v1/arenas/{arena_id}", headers=auth_headers_1)
    assert resp_arena.status_code == 200
    assert resp_arena.json()["status"] == "completed"

    resp_rounds_after = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=auth_headers_1)
    assert resp_rounds_after.json()[0]["status"] == "completed"

    # 11. Check Results
    resp_results = client.get(f"/api/v1/arenas/{arena_id}/results", headers=auth_headers_1)
    assert resp_results.status_code == 200
    results = resp_results.json()
    assert len(results) == 2
    # Ensure they have total_score
    assert results[0]["total_score"] > 0
    assert results[1]["total_score"] > 0
