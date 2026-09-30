import pytest
import uuid
import time
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
import asyncpg

from app.schemas.ad import AdIntentCreate
from app.services.ad_service import AdService, get_admob_public_key, _admob_keys_cache, _CACHE_TTL
from app.repositories.ad_repository import AdRepository
from app.core.errors import ForbiddenError, ConflictError
from app.core.config import settings

pytestmark = pytest.mark.asyncio
import pytest_asyncio

@pytest_asyncio.fixture
async def ad_service():
    connection = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    svc = AdService(connection)
    try:
        yield svc
    finally:
        await connection.close()

@pytest_asyncio.fixture
async def conn():
    connection = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    try:
        yield connection
    finally:
        await connection.close()

async def test_legacy_client_compatibility(client: AsyncClient, test_user_1_headers: dict):
    # Old client without X-Client-Version header
    headers = {**test_user_1_headers, "Idempotency-Key": str(uuid.uuid4())}
    # It should bypass the Ad Gate
    res = client.post("/api/v1/arenas", json={
        "max_rounds": 3,
        "max_participants": 2,
        "time_limit_seconds": 30
    }, headers=headers)
    assert res.status_code == 201

async def test_new_free_client_requires_ad_intent(client: AsyncClient, test_user_1_headers: dict):
    # New client with X-Client-Version header but no ad intent
    headers = {
        **test_user_1_headers,
        "Idempotency-Key": str(uuid.uuid4()),
        "X-Client-Version": "2"
    }
    res = client.post("/api/v1/arenas", json={
        "max_rounds": 3,
        "max_participants": 2,
        "time_limit_seconds": 30
    }, headers=headers)
    assert res.status_code == 403
    assert "Rewarded ad completion required" in res.json()['error']['message']

async def test_new_rivals_plus_client_bypasses_ad(client: AsyncClient, test_user_1_headers: dict, conn, test_user_1):
    # Mock rivals_plus entitlement
    await conn.execute("INSERT INTO subscriptions (user_id, entitlement_id, product_id, environment, revenuecat_app_user_id, status) VALUES ($1, 'rivals_plus', 'dummy_product', 'production', $2, 'active')", uuid.UUID(test_user_1), test_user_1)

    headers = {
        **test_user_1_headers,
        "Idempotency-Key": str(uuid.uuid4()),
        "X-Client-Version": "2"
    }
    res = client.post("/api/v1/arenas", json={
        "max_rounds": 3,
        "max_participants": 2,
        "time_limit_seconds": 30
    }, headers=headers)

    # Cleanup
    await conn.execute("DELETE FROM subscriptions WHERE user_id = $1", uuid.UUID(test_user_1))

    assert res.status_code == 201

async def test_unexpired_completed_intent_succeeds(ad_service, test_user_1):
    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="create_arena"))
    await ad_service.ad_repo.mark_intent_completed(intent.id)
    # Should not raise exception
    await ad_service.consume_intent(intent.id, test_user_1, "create_arena")

async def test_expired_completed_intent_is_rejected(ad_service, conn, test_user_1):
    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="create_wager"))
    await ad_service.ad_repo.mark_intent_completed(intent.id)

    # Manually expire it
    await conn.execute("UPDATE ad_intents SET expires_at = timezone('utc'::text, now()) - interval '1 minute' WHERE id = $1", intent.id)

    with pytest.raises(ConflictError) as excinfo:
        await ad_service.consume_intent(intent.id, test_user_1, "create_wager")
    assert "Valid completed ad intent for create_wager not found" in str(excinfo.value)

async def test_consumed_intent_cannot_be_reused(ad_service, test_user_1):
    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="create_arena"))
    await ad_service.ad_repo.mark_intent_completed(intent.id)
    await ad_service.consume_intent(intent.id, test_user_1, "create_arena")

    # Second attempt
    with pytest.raises(ConflictError):
        await ad_service.consume_intent(intent.id, test_user_1, "create_arena")

async def test_intent_belonging_to_another_user_is_rejected(ad_service, conn, test_user_1):
    # create a second user
    second_user = str(uuid.uuid4())
    await conn.execute("INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', '{}', now(), now(), '', '', '', '') ON CONFLICT DO NOTHING", uuid.UUID(second_user), f"{second_user}@example.com")

    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="create_arena"))
    await ad_service.ad_repo.mark_intent_completed(intent.id)

    with pytest.raises(ConflictError):
        await ad_service.consume_intent(intent.id, second_user, "create_arena")

async def test_wrong_action_intent_is_rejected(ad_service, test_user_1):
    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="create_arena"))
    await ad_service.ad_repo.mark_intent_completed(intent.id)

    with pytest.raises(ConflictError):
        await ad_service.consume_intent(intent.id, test_user_1, "create_wager")

async def test_duplicate_ssv_event_cannot_award_twice(ad_service, test_user_1, conn):
    # Create intent for reward
    intent = await ad_service.create_intent(test_user_1, AdIntentCreate(action="claim_reward"))

    event_id = str(uuid.uuid4())

    # We fake verification by directly calling processing loop logic that skips signature check in testing
    # if ENVIRONMENT==local (which it should be in tests)

    # First delivery
    await ad_service.process_ssv_webhook(
        query_string="test=1",
        custom_data=str(intent.id),
        signature="fake",
        key_id="fake_key",
        event_id=event_id,
        reward_amount=60,
        reward_item="coins"
    )

    # Check coins
    balance_1 = await ad_service.coin_service.get_balance(test_user_1)

    # Verify ledger entry
    ledger_entries = await conn.fetch(
        "SELECT reason, amount FROM coin_ledger WHERE user_id = $1 AND reference_table = 'ad_intents'",
        uuid.UUID(test_user_1)
    )
    assert len(ledger_entries) == 1
    assert ledger_entries[0]['reason'] == 'rewarded_ad'
    assert ledger_entries[0]['amount'] == 60

    # Second delivery (duplicate event_id)
    await ad_service.process_ssv_webhook(
        query_string="test=1",
        custom_data=str(intent.id),
        signature="fake",
        key_id="fake_key",
        event_id=event_id,
        reward_amount=60,
        reward_item="coins"
    )

    balance_2 = await ad_service.coin_service.get_balance(test_user_1)
    assert balance_1 == balance_2

    # Verify no new ledger entry was created
    ledger_entries_2 = await conn.fetch(
        "SELECT reason, amount FROM coin_ledger WHERE user_id = $1 AND reference_table = 'ad_intents'",
        uuid.UUID(test_user_1)
    )
    assert len(ledger_entries_2) == 1

async def test_enum_values_remain_untouched(conn):
    # Verify daily_reward and other values are present and unchanged
    result = await conn.fetch("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'coin_ledger_reason'::regtype")
    labels = [row['enumlabel'] for row in result]
    assert 'daily_reward' in labels
    assert 'rewarded_ad' in labels
    assert 'purchase' in labels
    assert 'weekly_bonus' in labels

async def test_admob_key_cache_refresh(monkeypatch):
    import time

    # Initial state
    _admob_keys_cache.clear()

    # Mock httpx AsyncClient
    class MockResponse:
        status_code = 200
        def json(self):
            return {"keys": [{"keyId": "test_key", "pem": "test_pem"}]}

    class MockClient:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def get(self, url): return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient", MockClient)

    pem = await get_admob_public_key("test_key")
    assert pem == "test_pem"
    assert "test_key" in _admob_keys_cache

    # test TTL logic
    # Set expiration to past
    old_pem, _ = _admob_keys_cache["test_key"]
    _admob_keys_cache["test_key"] = (old_pem, time.time() - 100)

    # Will refresh again
    pem2 = await get_admob_public_key("test_key")
    assert pem2 == "test_pem"
