import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
import asyncpg
import os
import jwt
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.main import app

def generate_test_token(user_id: str):
    secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    payload = {
        "sub": user_id,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, secret, algorithm="HS256")

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

import asyncio

@pytest.fixture(scope="module")
def setup_users():
    user1_id = str(uuid4())
    user2_id = str(uuid4())
    
    async def _setup():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        try:
            # Create user1
            await conn.execute("INSERT INTO auth.users (id, instance_id, role, aud) VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')", user1_id)
            await conn.execute("INSERT INTO profiles (id, username) VALUES ($1, $2)", user1_id, f"user1_{user1_id[:8]}")
            
            # Create user2
            await conn.execute("INSERT INTO auth.users (id, instance_id, role, aud) VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')", user2_id)
            await conn.execute("INSERT INTO profiles (id, username) VALUES ($1, $2)", user2_id, f"user2_{user2_id[:8]}")
        finally:
            await conn.close()
            
    async def _teardown():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        try:
            await conn.execute("DELETE FROM auth.users WHERE id IN ($1, $2)", user1_id, user2_id)
        finally:
            await conn.close()

    asyncio.run(_setup())
    yield {"user1": user1_id, "user2": user2_id}
    asyncio.run(_teardown())

def test_search_users(client: TestClient, setup_users: dict):
    user1_id = setup_users["user1"]
    
    headers = {"Authorization": f"Bearer {generate_test_token(user1_id)}"}
    response = client.get("/api/v1/users/search?q=user2", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["username"].startswith("user2_")

def test_friend_request_flow(client: TestClient, setup_users: dict):
    user1_id = setup_users["user1"]
    user2_id = setup_users["user2"]
    
    headers1 = {"Authorization": f"Bearer {generate_test_token(user1_id)}"}
    headers2 = {"Authorization": f"Bearer {generate_test_token(user2_id)}"}
    
    # 1. User1 sends friend request to User2
    response = client.post(
        "/api/v1/friends/requests",
        json={"friend_id": user2_id},
        headers=headers1
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["user_id"] == user1_id
    assert data["friend_id"] == user2_id
    request_id = data["id"]
    
    # 2. Prevent duplicate request
    response_dup = client.post(
        "/api/v1/friends/requests",
        json={"friend_id": user2_id},
        headers=headers1
    )
    assert response_dup.status_code == 409
    
    # 3. User2 views pending requests
    response_pending = client.get("/api/v1/friends/requests/pending", headers=headers2)
    assert response_pending.status_code == 200
    pending_data = response_pending.json()
    assert len(pending_data) == 1
    assert pending_data[0]["id"] == request_id
    assert pending_data[0]["friend_username"].startswith("user1_")
    
    # 4. User2 accepts the request
    response_accept = client.put(
        f"/api/v1/friends/requests/{request_id}/respond",
        json={"accept": True},
        headers=headers2
    )
    assert response_accept.status_code == 200
    accept_data = response_accept.json()
    assert accept_data["status"] == "accepted"
    
    # 5. Verify friendship exists for both
    resp_friends1 = client.get("/api/v1/friends", headers=headers1)
    assert resp_friends1.status_code == 200
    assert len(resp_friends1.json()) == 1
    assert resp_friends1.json()[0]["friend_id"] == user2_id
    
    resp_friends2 = client.get("/api/v1/friends", headers=headers2)
    assert resp_friends2.status_code == 200
    assert len(resp_friends2.json()) == 1
    assert resp_friends2.json()[0]["friend_id"] == user1_id
    
    # 6. User1 removes User2
    resp_delete = client.delete(f"/api/v1/friends/{user2_id}", headers=headers1)
    assert resp_delete.status_code == 204
    
    resp_friends1_after = client.get("/api/v1/friends", headers=headers1)
    assert len(resp_friends1_after.json()) == 0
    
    resp_friends2_after = client.get("/api/v1/friends", headers=headers2)
    assert len(resp_friends2_after.json()) == 0

def test_reject_friend_request(client: TestClient, setup_users: dict):
    user1_id = setup_users["user1"]
    user2_id = setup_users["user2"]
    
    headers1 = {"Authorization": f"Bearer {generate_test_token(user1_id)}"}
    headers2 = {"Authorization": f"Bearer {generate_test_token(user2_id)}"}
    
    # Send request
    response = client.post(
        "/api/v1/friends/requests",
        json={"friend_id": user2_id},
        headers=headers1
    )
    request_id = response.json()["id"]
    
    # Reject request
    response_reject = client.put(
        f"/api/v1/friends/requests/{request_id}/respond",
        json={"accept": False},
        headers=headers2
    )
    assert response_reject.status_code == 200
    assert response_reject.json()["status"] == "rejected"
    
    # Prevent duplicate request
    response_dup = client.post(
        "/api/v1/friends/requests",
        json={"friend_id": user2_id},
        headers=headers1
    )
    assert response_dup.status_code == 409
