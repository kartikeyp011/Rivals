import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import os
import asyncio
import asyncpg
from datetime import datetime, timezone

import os
from dotenv import load_dotenv
load_dotenv(".env", override=True)


from app.main import app
from app.core.config import settings
from app.core.db import get_db_connection
import asyncpg

async def override_get_db_connection():
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    try:
        yield conn
    finally:
        await conn.close()

app.dependency_overrides[get_db_connection] = override_get_db_connection

def generate_test_token(user_id: str, role: str = "authenticated"):
    import jwt
    from datetime import timedelta
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
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
def client():
    with TestClient(app) as c:
        yield c

async def create_user_in_db(user_id: str):
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        await conn.execute("""
            INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', '{}', now(), now(), '', '', '', '')
            ON CONFLICT DO NOTHING
        """, user_id, f"{user_id}@example.com")
        await conn.execute("""
            INSERT INTO profiles (id, username)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        """, user_id, f"user_{user_id[:8]}")
        await conn.close()
    except Exception:
        pass  # allow offline testing

async def delete_user_from_db(user_id: str):
    """Remove a test user row. ON DELETE CASCADE on profiles handles dependent rows."""
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        await conn.execute("DELETE FROM auth.users WHERE id = $1", user_id)
        await conn.close()
    except Exception:
        pass  # Best-effort: offline or already removed

@pytest.fixture(scope="module")
def test_user_1():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id))
    yield user_id
    asyncio.run(delete_user_from_db(user_id))

@pytest.fixture(scope="module")
def test_user_2():
    user_id = str(uuid4())
    asyncio.run(create_user_in_db(user_id))
    yield user_id
    asyncio.run(delete_user_from_db(user_id))

@pytest.fixture(scope="module")
def test_user_1_headers(test_user_1):
    return {"Authorization": f"Bearer {generate_test_token(test_user_1)}"}

@pytest.fixture(scope="module")
def test_user_2_headers(test_user_2):
    return {"Authorization": f"Bearer {generate_test_token(test_user_2)}"}
