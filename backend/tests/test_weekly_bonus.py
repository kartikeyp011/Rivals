import pytest
import asyncio
import asyncpg
import os
from datetime import datetime, timezone, timedelta
from app.core.config import settings

# Test helper to simulate subscriptions
async def _set_subscription_state(user_id, status, will_renew=True):
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    await conn.execute(
        """
        INSERT INTO subscriptions (
            user_id, provider, product_id, entitlement_id, status, environment,
            purchased_at, expires_at, will_renew, store_transaction_id, revenuecat_app_user_id
        ) VALUES (
            $1, 'revenuecat', 'rivals_plus_monthly', 'rivals_plus', $2, 'sandbox',
            now(), now() + interval '30 days', $3, 'tx_123', $4
        )
        ON CONFLICT (user_id, entitlement_id) DO UPDATE SET
            status = EXCLUDED.status,
            will_renew = EXCLUDED.will_renew
        """,
        user_id, status, will_renew, user_id
    )
    await conn.close()

async def _shift_claim_period(user_id, weeks=-1):
    conn = await asyncpg.connect(settings.DATABASE_URL, statement_cache_size=0)
    await conn.execute(
        """
        UPDATE rivals_plus_weekly_claims
        SET period_start = period_start + ($2 || ' weeks')::interval,
            period_end = period_end + ($2 || ' weeks')::interval
        WHERE user_id = $1
        """,
        user_id, str(weeks)
    )
    await conn.close()

def test_weekly_bonus_unauthorized(client):
    response = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim")
    assert response.status_code == 401

def test_weekly_bonus_no_subscription(client, test_user_1_headers):
    pass

    response = client.post(
        "/api/v1/subscriptions/rivals-plus/weekly-bonus/claim",
        headers=test_user_1_headers
    )
    assert response.status_code == 409
    assert response.json()["error"]["message"] == "Active Rivalss+ subscription required to claim weekly bonus"

def test_weekly_bonus_successful_claim(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "active"))

    response = client.post(
        "/api/v1/subscriptions/rivals-plus/weekly-bonus/claim",
        headers=test_user_1_headers
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["claimed"] is True
    assert data["already_claimed"] is False
    assert data["coins_awarded"] == 250
    assert data["balance"] >= 250
    assert "period_start" in data

def test_weekly_bonus_already_claimed(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "active"))

    # First claim (might have already happened in previous test, that's fine, we will test the second claim)
    client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    
    # Second claim in same period
    res2 = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    assert res2.status_code == 200
    data = res2.json()
    
    assert data["claimed"] is False
    assert data["already_claimed"] is True
    assert data["coins_awarded"] == 0

def test_weekly_bonus_canceled_but_active(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "active", will_renew=False))
    asyncio.run(_shift_claim_period(test_user_1))

    response = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    assert response.status_code == 200
    assert response.json()["claimed"] is True

def test_weekly_bonus_expired(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "expired"))

    response = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    assert response.status_code == 409

def test_weekly_bonus_next_period(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "active"))
    
    res1 = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    
    # Shift claims to the past
    asyncio.run(_shift_claim_period(test_user_1, -1))

    res2 = client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
    assert res2.status_code == 200
    assert res2.json()["claimed"] is True

# Test concurrency using ThreadPoolExecutor since TestClient is synchronous
def test_weekly_bonus_concurrent_claims(client, test_user_1, test_user_1_headers):
    asyncio.run(_set_subscription_state(test_user_1, "active"))
    asyncio.run(_shift_claim_period(test_user_1, -1))
    
    import concurrent.futures
    
    def make_request():
        return client.post("/api/v1/subscriptions/rivals-plus/weekly-bonus/claim", headers=test_user_1_headers)
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_request) for _ in range(5)]
        responses = [f.result() for f in futures]
        
    success_count = 0
    already_claimed_count = 0
    
    for r in responses:
        assert r.status_code == 200
        data = r.json()
        if data["claimed"]:
            success_count += 1
        elif data["already_claimed"]:
            already_claimed_count += 1
            
    assert success_count == 1
    assert already_claimed_count == 4
