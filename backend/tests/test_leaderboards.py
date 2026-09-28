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
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        # Opt-in user 1, opt-out user 2
        u1_name = f"z_user_{str(uuid4())[:8]}"
        u2_name = f"a_user_{str(uuid4())[:8]}"
        await conn.execute("UPDATE profiles SET global_opt_in = TRUE, username = $2 WHERE id = $1", test_user_1, u1_name)
        await conn.execute("UPDATE profiles SET global_opt_in = FALSE, username = $2 WHERE id = $1", test_user_2, u2_name)

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
        await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_3, f"m_user_{user_3}")

        await svc.record_score(user_3, now, "UTC", 500, False)
        await svc.repo.upsert_score(user_3, "daily", period_key, 500, False)

        # Brand-new user with no row in leaderboards, score 0, global_opt_in = TRUE, friend of test_user_1
        user_0_in = str(uuid4())
        await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_in, f"{user_0_in}@test.com")
        await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_0_in, f"c_zero_{str(uuid4())[:8]}")
        await repo.insert_reciprocal_friend(test_user_1, user_0_in)
        await repo.insert_reciprocal_friend(user_0_in, test_user_1)

        # Brand-new user with no row in leaderboards, score 0, global_opt_in = FALSE, friend of test_user_1
        user_0_out = str(uuid4())
        await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_out, f"{user_0_out}@test.com")
        await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, FALSE)", user_0_out, f"d_zero_{str(uuid4())[:8]}")
        await repo.insert_reciprocal_friend(test_user_1, user_0_out)
        await repo.insert_reciprocal_friend(user_0_out, test_user_1)

        await conn.close()
        return user_3, user_0_in, user_0_out, period_key

    user_3, user_0_in, user_0_out, period_key = asyncio.run(setup_leaderboards())

    # 1. Global leaderboard
    res = client.get(f"/api/v1/leaderboards/global?period=daily&period_key={period_key}", headers=test_user_1_headers)
    assert res.status_code == 200
    data = res.json()

    user_ids = [d["user_id"] for d in data]
    assert test_user_1 in user_ids
    assert user_3 in user_ids
    assert test_user_2 not in user_ids

    # Check A, B, C
    assert user_0_in in user_ids # B
    assert user_0_out not in user_ids # C

    # Rank check and ordering (D)
    idx_m = user_ids.index(user_3)
    idx_z = user_ids.index(test_user_1)
    assert idx_m < idx_z # m_user should be before z_user
    assert data[idx_m]["score"] == 500
    assert data[idx_z]["score"] == 500
    assert data[idx_m]["rank"] == 1
    assert data[idx_z]["rank"] == 1

    # 2. Friends leaderboard (user 1 requesting)
    res = client.get(f"/api/v1/leaderboards/friends?period=daily&period_key={period_key}", headers=test_user_1_headers)
    assert res.status_code == 200
    data = res.json()

    user_ids = [d["user_id"] for d in data]
    assert test_user_1 in user_ids
    assert test_user_2 in user_ids
    assert user_3 not in user_ids
    assert user_0_in in user_ids # A
    assert user_0_out in user_ids # A

    # Both User 1 and User 2 have 500 score, so they should be tied at Rank 1
    idx_a = user_ids.index(test_user_2)
    idx_z2 = user_ids.index(test_user_1)
    assert idx_a < idx_z2 # a_user before z_user
    assert data[idx_a]["rank"] == 1
    assert data[idx_z2]["rank"] == 1

@pytest.mark.asyncio
async def test_get_user_rank(test_user_1):
    # E. get_user_rank() for a globally opted-in user with no leaderboard row
    from app.repositories.leaderboard_repository import LeaderboardRepository
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    repo = LeaderboardRepository(conn)

    period_key = f"test-2026-09-12-rank-{uuid4()}"
    await repo.upsert_score(test_user_1, "daily", period_key, 500, True)

    user_0_in = str(uuid4())
    await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_in, f"{user_0_in}@test.com")
    await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_0_in, f"c_zero_{str(uuid4())[:8]}")

    rank_entry = await repo.get_user_rank(user_0_in, "daily", period_key)
    await conn.close()

    assert rank_entry is not None
    assert rank_entry.score == 0
    assert rank_entry.user_id == user_0_in
    assert rank_entry.rank == 2
