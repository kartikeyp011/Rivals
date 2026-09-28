import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import os

from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
# Since we use BypassSandbox, the pool will initialize correctly.

# We need a mocked valid JWT for the Authorization header.
# We will use the ANON_KEY or SERVICE_ROLE_KEY from supabase status.
# The ANON_KEY is the standard for unauthenticated/anonymous access in Supabase.
# Wait, the app uses standard JWT decode. We'll bypass the signature verification in test if needed,
# but the app actually fetches the jwt secret from .env which matches local supabase.
import jwt
from datetime import datetime, timezone, timedelta

def generate_test_token(user_id: str, role: str = "authenticated"):
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    return jwt.encode(payload, secret, algorithm="HS256")

import asyncio
import asyncpg
from app.core.config import settings

@pytest.fixture(scope="module")
def test_user_id():
    user_id = str(uuid4())
    async def create_user():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        await conn.execute("""
            INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', '{}', now(), now(), '', '', '', '')
        """, user_id, f"{user_id}@example.com")
        await conn.close()
    
    asyncio.run(create_user())
    return user_id

@pytest.fixture(scope="module")
def auth_headers(test_user_id):
    token = generate_test_token(test_user_id)
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_unauthorized(client):
    response = client.post("/api/v1/arenas", json={"category_ids": [1], "max_rounds": 3, "wager_amount": 10})
    assert response.status_code == 401

def test_create_arena_and_idempotency(client, auth_headers):
    idem_key = str(uuid4())
    payload = {
        "max_rounds": 2
    }
    
    headers = {**auth_headers, "Idempotency-Key": idem_key}

    # First request should create the arena
    response1 = client.post("/api/v1/arenas", json=payload, headers=headers)
    print("RESPONSE 1:", response1.json())
    assert response1.status_code == 201
    data1 = response1.json()
    assert "id" in data1
    assert data1["host_user_id"] != ""
    assert data1["status"] == "pending"

    # Second request with the same idempotency key and same payload should return 200/201 and the SAME data
    response2 = client.post("/api/v1/arenas", json=payload, headers=headers)
    assert response2.status_code in [200, 201]
    assert response2.json() == data1
    
    # Third request with the same idempotency key but different payload should return 409
    payload["max_rounds"] = 1
    response3 = client.post("/api/v1/arenas", json=payload, headers=headers)
    assert response3.status_code == 409
    assert response3.json()["error"]["message"] == "IDEMPOTENCY_KEY_REUSED"

def test_get_arenas(client, auth_headers):
    response = client.get("/api/v1/arenas", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_arena_not_found(client, auth_headers):
    random_uuid = str(uuid4())
    response = client.get(f"/api/v1/arenas/{random_uuid}", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"].lower() == "not_found"

def test_start_arena_forbidden(client, auth_headers, test_user_id):
    # Create arena as one user
    idem_key = str(uuid4())
    payload = {"max_rounds": 2}
    headers = {**auth_headers, "Idempotency-Key": idem_key}
    response1 = client.post("/api/v1/arenas", json=payload, headers=headers)
    print("START FORBIDDEN RESPONSE 1:", response1.json())
    arena_id = response1.json()["id"]

    # Try to start as another user
    other_user = str(uuid4())
    other_headers = {"Authorization": f"Bearer {generate_test_token(other_user)}"}
    
    response2 = client.post(f"/api/v1/arenas/{arena_id}/start", headers=other_headers)
    assert response2.status_code == 403
    assert response2.json()["error"]["code"].lower() == "forbidden"

def test_response_leak(client, auth_headers):
    # Verify that `correct_option` is not in the round schema
    idem_key = str(uuid4())
    payload = {"max_rounds": 2}
    headers = {**auth_headers, "Idempotency-Key": idem_key}
    response = client.post("/api/v1/arenas", json=payload, headers=headers)
    print("RESPONSE LEAK RESPONSE 1:", response.json())
    arena_id = response.json()["id"]
    
    # Start arena
    idem_key_start = str(uuid4())
    headers_start = {**auth_headers, "Idempotency-Key": idem_key_start}
    start_resp = client.post(f"/api/v1/arenas/{arena_id}/start", headers=headers_start)
    assert start_resp.status_code == 200
    
    rounds_resp = client.get(f"/api/v1/arenas/{arena_id}/rounds", headers=auth_headers)
    assert rounds_resp.status_code == 200
    rounds = rounds_resp.json()
    for r in rounds:
        assert "correct_option" not in r
        assert "question_prompt" in r
