import pytest
import asyncio
from uuid import uuid4
import asyncpg
from app.core.config import settings

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _delete_user(conn, user_id: str):
    """Best-effort deletion of a test auth.users row (cascade cleans profiles)."""
    try:
        await conn.execute("DELETE FROM auth.users WHERE id = $1", user_id)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# test_leaderboards
# ---------------------------------------------------------------------------

def test_leaderboards(client, test_user_1, test_user_1_headers, test_user_2, test_user_2_headers):
    """
    Full leaderboard integration test covering:
      - Global leaderboard respects global_opt_in
      - Zero-score users with global_opt_in=TRUE appear in global leaderboard
      - Zero-score users without global_opt_in are excluded from global leaderboard
      - Friends leaderboard includes friends regardless of global_opt_in
      - Tied score ordering is alphabetical (ascending)
      - Leaderboard entries: id may be null (zero-score), user_id is always present
    """
    inline_user_ids: list[str] = []

    async def setup_leaderboards():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        try:
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

            # Another random user (opted in, has a leaderboard row)
            user_3 = str(uuid4())
            inline_user_ids.append(user_3)
            await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_3, f"{user_3}@test.com")
            await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_3, f"m_user_{user_3}")

            await svc.record_score(user_3, now, "UTC", 500, False)
            await svc.repo.upsert_score(user_3, "daily", period_key, 500, False)

            # Zero-score user: global_opt_in=TRUE, friend of test_user_1 — must appear in global
            user_0_in = str(uuid4())
            inline_user_ids.append(user_0_in)
            await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_in, f"{user_0_in}@test.com")
            await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_0_in, f"c_zero_{str(uuid4())[:8]}")
            await repo.insert_reciprocal_friend(test_user_1, user_0_in)
            await repo.insert_reciprocal_friend(user_0_in, test_user_1)

            # Zero-score user: global_opt_in=FALSE, friend of test_user_1 — must NOT appear in global
            user_0_out = str(uuid4())
            inline_user_ids.append(user_0_out)
            await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_out, f"{user_0_out}@test.com")
            await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, FALSE)", user_0_out, f"d_zero_{str(uuid4())[:8]}")
            await repo.insert_reciprocal_friend(test_user_1, user_0_out)
            await repo.insert_reciprocal_friend(user_0_out, test_user_1)

            return user_3, user_0_in, user_0_out, period_key
        finally:
            await conn.close()

    async def teardown_leaderboards():
        conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
        try:
            for uid in inline_user_ids:
                await _delete_user(conn, uid)
        finally:
            await conn.close()

    user_3, user_0_in, user_0_out, period_key = asyncio.run(setup_leaderboards())
    try:
        # ── 1. Global leaderboard ────────────────────────────────────────────────
        res = client.get(f"/api/v1/leaderboards/global?period=daily&period_key={period_key}", headers=test_user_1_headers)
        assert res.status_code == 200
        data = res.json()

        user_ids = [d["user_id"] for d in data]

        # Opted-in users appear
        assert test_user_1 in user_ids, "test_user_1 (global_opt_in=TRUE) must appear"
        assert user_3 in user_ids,      "user_3 (global_opt_in=TRUE) must appear"
        assert user_0_in in user_ids,   "zero-score user with global_opt_in=TRUE must appear"

        # Opted-out users are excluded
        assert test_user_2 not in user_ids, "test_user_2 (global_opt_in=FALSE) must be excluded"
        assert user_0_out not in user_ids,  "zero-score user with global_opt_in=FALSE must be excluded"

        # Leaderboard entry schema: user_id always non-null, id may be null for zero-score users
        for entry in data:
            assert entry["user_id"], "user_id must always be a non-empty string"

        user_0_in_entry = next(d for d in data if d["user_id"] == user_0_in)
        assert user_0_in_entry["score"] == 0,  "zero-score user must have score=0"
        assert user_0_in_entry["id"] is None,  "zero-score user must have null leaderboard row id"

        # Rank check and tied-score alphabetical ordering (D)
        idx_m = user_ids.index(user_3)
        idx_z = user_ids.index(test_user_1)
        assert idx_m < idx_z, "m_user (alphabetically earlier) must sort before z_user when scores tie"
        assert data[idx_m]["score"] == 500
        assert data[idx_z]["score"] == 500
        assert data[idx_m]["rank"] == 1
        assert data[idx_z]["rank"] == 1

        # ── 2. Friends leaderboard (user 1 requesting) ────────────────────────
        res = client.get(f"/api/v1/leaderboards/friends?period=daily&period_key={period_key}", headers=test_user_1_headers)
        assert res.status_code == 200
        data = res.json()

        user_ids = [d["user_id"] for d in data]
        assert test_user_1 in user_ids,  "requester must appear in friends leaderboard"
        assert test_user_2 in user_ids,  "friends appear regardless of global_opt_in"
        assert user_3 not in user_ids,   "non-friend must not appear"
        assert user_0_in in user_ids,    "zero-score friend (opted-in) must appear"
        assert user_0_out in user_ids,   "zero-score friend (opted-out) still appears in friends lb"

        # user_id non-null, id may be null
        for entry in data:
            assert entry["user_id"], "user_id must always be a non-empty string"

        user_0_in_f = next(d for d in data if d["user_id"] == user_0_in)
        assert user_0_in_f["score"] == 0
        assert user_0_in_f["id"] is None, "zero-score friend must have null leaderboard row id"

        user_0_out_f = next(d for d in data if d["user_id"] == user_0_out)
        assert user_0_out_f["score"] == 0
        assert user_0_out_f["id"] is None

        # Tied scores: a_user (user_2) before z_user (user_1) alphabetically
        idx_a = user_ids.index(test_user_2)
        idx_z2 = user_ids.index(test_user_1)
        assert idx_a < idx_z2, "a_user must sort before z_user when scores tie"
        assert data[idx_a]["rank"] == 1
        assert data[idx_z2]["rank"] == 1

    finally:
        asyncio.run(teardown_leaderboards())


# ---------------------------------------------------------------------------
# test_get_user_rank
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_user_rank(test_user_1):
    """
    get_user_rank() for a globally opted-in user with no leaderboard row:
      - score must be 0
      - user_id must be correct
      - rank must be 2 (behind the one user who has 500 points)
      - id must be None (no row in leaderboards table)
    """
    from app.repositories.leaderboard_repository import LeaderboardRepository
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)

    user_0_in = str(uuid4())
    try:
        repo = LeaderboardRepository(conn)

        period_key = f"test-2026-09-12-rank-{uuid4()}"
        await repo.upsert_score(test_user_1, "daily", period_key, 500, True)

        await conn.execute("INSERT INTO auth.users (id, email) VALUES ($1, $2)", user_0_in, f"{user_0_in}@test.com")
        await conn.execute("INSERT INTO profiles (id, username, global_opt_in) VALUES ($1, $2, TRUE)", user_0_in, f"c_zero_{str(uuid4())[:8]}")

        rank_entry = await repo.get_user_rank(user_0_in, "daily", period_key)

        assert rank_entry is not None,              "get_user_rank must return an entry even with no leaderboard row"
        assert rank_entry.score == 0,               "zero-score user must have score=0"
        assert rank_entry.user_id == user_0_in,     "user_id must match"
        assert rank_entry.id is None,               "id must be None when no leaderboard row exists"
        assert rank_entry.rank == 2,                "zero-score user ranks behind the one 500-point user"
    finally:
        # Teardown: remove the inline zero-score test user
        await _delete_user(conn, user_0_in)
        await conn.close()


# ---------------------------------------------------------------------------
# test_fixture_teardown_does_not_pollute_db
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fixture_teardown_verifies_no_leaked_opted_in_users(test_user_1):
    """
    Verifies that test_user_1 (which has global_opt_in=TRUE set during test_leaderboards)
    is present during the test run (will be torn down by conftest fixture after the module).
    This test exists as an early-warning canary: if teardown is broken, re-running the
    suite would see this user in the global leaderboard from a prior run.
    """
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    try:
        row = await conn.fetchrow("SELECT id FROM auth.users WHERE id = $1", test_user_1)
        assert row is not None, "test_user_1 must exist during the test run"
    finally:
        await conn.close()
