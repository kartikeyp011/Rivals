import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import os
import jwt
from datetime import datetime, timezone, timedelta
import asyncio
import asyncpg
from app.core.config import settings

from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def generate_test_token(user_id: str, role: str = "authenticated"):
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    from app.core.config import settings
    payload = {
        "sub": user_id,
        "role": role,
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    return jwt.encode(payload, secret, algorithm="HS256")

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


def test_get_config_options(client, auth_headers):
    response = client.get("/api/v1/arenas/config/options", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "max_participants_min" in data
    assert "max_rounds_max" in data
    assert "categories" in data
    assert isinstance(data["categories"], list)

def test_create_custom_arena_valid(client, auth_headers):
    idem_key = str(uuid4())
    payload = {
        "max_participants": 4,
        "max_rounds": 1,
        "time_limit_seconds": 60,
        "difficulty": "easy",
        "category": "Science"
    }
    
    headers = {**auth_headers, "Idempotency-Key": idem_key}
    response = client.post("/api/v1/arenas", json=payload, headers=headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["max_participants"] == 4
    assert data["max_rounds"] == 1
    assert data["time_limit_seconds"] == 60
    assert data["difficulty"] == "easy"
    assert data["category"] == "Science"

def test_create_custom_arena_invalid_bounds(client, auth_headers):
    idem_key1 = str(uuid4())
    # max_rounds too high
    payload1 = {
        "max_rounds": 50
    }
    headers1 = {**auth_headers, "Idempotency-Key": idem_key1}
    response1 = client.post("/api/v1/arenas", json=payload1, headers=headers1)
    
    # Pydantic validation should catch it before hitting Postgres, returning 422
    assert response1.status_code == 422
    assert "detail" in response1.json()

    idem_key2 = str(uuid4())
    # time_limit_seconds too low
    payload2 = {
        "time_limit_seconds": 2
    }
    headers2 = {**auth_headers, "Idempotency-Key": idem_key2}
    response2 = client.post("/api/v1/arenas", json=payload2, headers=headers2)
    
    assert response2.status_code == 422

    idem_key3 = str(uuid4())
    # max_participants too high
    payload3 = {
        "max_participants": 10
    }
    headers3 = {**auth_headers, "Idempotency-Key": idem_key3}
    response3 = client.post("/api/v1/arenas", json=payload3, headers=headers3)
    
    assert response3.status_code == 422
