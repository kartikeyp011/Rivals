import pytest
import asyncio
from uuid import uuid4
import asyncpg
from app.core.config import settings

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

def test_leaderboards(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    # Setup users and scores directly via service
    async def setup_leaderboards():
        conn = await asyncpg.connect(settings.DATABASE_URL)
        # Opt-in user 1, opt-out user 2
        await conn.execute("UPDATE profiles SET global_opt_in = TRUE WHERE id = $1", test_user_1)
        await conn.execute("UPDATE profiles SET global_opt_in = FALSE WHERE id = $1", test_user_2)
        
        # Add friends
        from app.repositories.friend_repository import FriendRepository
        repo = FriendRepository(conn)
        try:
            await repo.create_friend_request(test_user_1, test_user_2)
        except Exception:
            pass
        await repo.insert_reciprocal_friend(test_user_1, test_user_2)
        await repo.insert_reciprocal_friend(test_user_2, test_user_1)
        
        # Record scores
        from app.services.leaderboard_service import LeaderboardService
        from datetime import datetime, timezone
        now = datetime(2026, 9, 12, 12, 0, tzinfo=timezone.utc)
        
        period_key = f"test-2026-09-12-{uuid4()}"
        svc = LeaderboardService(conn)
        await svc.record_score(test_user_1, now, "UTC", 500, True)
        await svc.repo.upsert_score(test_user_1, "daily", period_key, 500, True)
        
        await svc.record_score(test_user_2, now, "UTC", 500, False)
        await svc.repo.upsert_score(test_user_2, "daily", period_key, 500, False)
        
        # Another random user (opted in)
        user_3 = str(uuid4())
        await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_3, f"{user_3}@test.com")
        await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_3, f"user3_{user_3}")
        
        await svc.record_score(user_3, now, "UTC", 400, False)
        await svc.repo.upsert_score(user_3, "daily", period_key, 400, False)
        
        await conn.close()
        return user_3, period_key
        
    user_3, period_key = asyncio.run(setup_leaderboards())
    
    # 1. Global leaderboard
    res = client.get(f"/api/v1/leaderboards/global?period=daily&period_key={period_key}", headers=test_user_1_headers)
    assert res.status_code == 200
    data = res.json()
    
    # User 1 and User 3 should be there. User 2 opted out.
    user_ids = [d["user_id"] for d in data]
    assert test_user_1 in user_ids
    assert user_3 in user_ids
    assert test_user_2 not in user_ids
    
    # Rank check (user 1 = 500, user 3 = 400)
    assert data[0]["user_id"] == test_user_1
    assert data[0]["rank"] == 1
    assert data[1]["user_id"] == user_3
    assert data[1]["rank"] == 2
    
    # 2. Friends leaderboard (user 1 requesting)
    res = client.get(f"/api/v1/leaderboards/friends?period=daily&period_key={period_key}", headers=test_user_1_headers)
    assert res.status_code == 200
    data = res.json()
    
    # User 1 and User 2 should be there. User 3 is NOT a friend.
    user_ids = [d["user_id"] for d in data]
    assert test_user_1 in user_ids
    assert test_user_2 in user_ids
    assert user_3 not in user_ids
    
    # Both User 1 and User 2 have 500 score, so they should be tied at Rank 1
    assert data[0]["rank"] == 1
    assert data[1]["rank"] == 1
    assert data[0]["score"] == 500
    assert data[1]["score"] == 500
