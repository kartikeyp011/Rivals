import pytest
from httpx import AsyncClient
from uuid import uuid4
import datetime

# Mock the REVENUECAT_WEBHOOK_SECRET in conftest or here, but it's loaded from env.
# Tests will run with test client.

def create_payload(event_type: str, app_user_id: str, event_id: str = None) -> dict:
    if not event_id:
        event_id = str(uuid4())
    return {
        "api_version": "1.0",
        "event": {
            "id": event_id,
            "type": event_type,
            "app_user_id": app_user_id,
            "aliases": [],
            "original_app_user_id": app_user_id,
            "product_id": "rivals_plus_monthly",
            "entitlement_ids": ["rivals_plus"],
            "period_type": "NORMAL",
            "purchased_at_ms": int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000),
            "expiration_at_ms": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)).timestamp() * 1000),
            "environment": "SANDBOX",
            "store": "APP_STORE",
            "transaction_id": "tx_" + str(uuid4())[:8],
            "original_transaction_id": "orig_tx_" + str(uuid4())[:8]
        }
    }

@pytest.mark.asyncio
async def test_webhook_unauthorized(client):
    payload = create_payload("INITIAL_PURCHASE", str(uuid4()))
    response = client.post("/api/v1/webhooks/revenuecat", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing Authorization header"

    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=payload, 
        headers={"Authorization": "Bearer WRONG_SECRET"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"

@pytest.mark.asyncio
async def test_webhook_malformed_payload(client, monkeypatch):
    from app.core.config import settings
    # Ensure secret is set for tests
    monkeypatch.setattr(settings, "REVENUECAT_WEBHOOK_SECRET", "test_secret")
    
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json={"bad": "payload"}, 
        headers={"Authorization": "Bearer test_secret"}
    )
    # Pydantic validation should fail
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_webhook_unknown_user(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "REVENUECAT_WEBHOOK_SECRET", "test_secret")
    
    # Random UUID not in DB
    unknown_id = str(uuid4())
    payload = create_payload("INITIAL_PURCHASE", unknown_id)
    
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=payload, 
        headers={"Authorization": "Bearer test_secret"}
    )
    
    # Should safely ignore
    assert response.status_code == 200
    assert response.json() == {"status": "ignored_unknown_user"}

@pytest.mark.asyncio
async def test_webhook_lifecycle_and_idempotency(client, test_user_1, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "REVENUECAT_WEBHOOK_SECRET", "test_secret")
    
    user_id = test_user_1
    event_id = str(uuid4())
    
    # 1. INITIAL_PURCHASE
    payload = create_payload("INITIAL_PURCHASE", user_id, event_id)
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=payload, 
        headers={"Authorization": "Bearer test_secret"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "processed"}
        
    # 2. Duplicate Event (Idempotency)
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=payload, 
        headers={"Authorization": "Bearer test_secret"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "already_processed"}
    
    # 3. CANCELLATION
    cancel_event_id = str(uuid4())
    cancel_payload = create_payload("CANCELLATION", user_id, cancel_event_id)
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=cancel_payload, 
        headers={"Authorization": "Bearer test_secret"}
    )
    assert response.status_code == 200
        
    # 4. EXPIRATION
    expire_event_id = str(uuid4())
    expire_payload = create_payload("EXPIRATION", user_id, expire_event_id)
    response = client.post(
        "/api/v1/webhooks/revenuecat", 
        json=expire_payload, 
        headers={"Authorization": "Bearer test_secret"}
    )
    assert response.status_code == 200
