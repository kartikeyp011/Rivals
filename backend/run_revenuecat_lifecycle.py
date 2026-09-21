import os
import sys
import uuid
import time
import httpx
import asyncio
import asyncpg

# Configuration
TEST_USER_ID = os.getenv("TEST_USER_ID")
if not TEST_USER_ID:
    print("ERROR: TEST_USER_ID environment variable is strictly required.")
    print("Safety mechanism: You must explicitly supply a test user UUID to ensure no real subscriptions are modified.")
    sys.exit(1)

PRODUCTION_SMOKE_TEST = os.getenv("PRODUCTION_SMOKE_TEST", "false").lower() == "true"
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "http://127.0.0.1:8000/api/v1/webhooks/revenuecat")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "local_test_secret_do_not_use_in_prod")
DATABASE_URL = os.getenv("DATABASE_URL")

if PRODUCTION_SMOKE_TEST:
    print("Running in PRODUCTION SMOKE TEST mode.")
    if "127.0.0.1" in WEBHOOK_URL or "localhost" in WEBHOOK_URL:
        print("ERROR: In PRODUCTION_SMOKE_TEST mode, WEBHOOK_URL must be explicitly set to the production URL.")
        sys.exit(1)

def generate_payload(event_type, event_id=None, transaction_id=None, timestamp_ms=None):
    if not event_id:
        event_id = str(uuid.uuid4())
    if not transaction_id:
        transaction_id = f"tx_synth_{uuid.uuid4().hex[:8]}"
    if not timestamp_ms:
        timestamp_ms = int(time.time() * 1000)
        
    return {
        "api_version": "1.0",
        "event": {
            "id": event_id,
            "type": event_type,
            "app_user_id": TEST_USER_ID,
            "original_app_user_id": TEST_USER_ID,
            "aliases": [TEST_USER_ID],
            "product_id": "rivals_plus_monthly",
            "entitlement_ids": ["rivals_plus"],
            "entitlement_id": "rivals_plus",
            "environment": "SANDBOX",
            "store": "APP_STORE",
            "transaction_id": transaction_id,
            "original_transaction_id": transaction_id,
            "purchased_at_ms": timestamp_ms,
            "expiration_at_ms": timestamp_ms + (30 * 24 * 60 * 60 * 1000), # +30 days
            "price": 4.99,
            "currency": "USD"
        }
    }

def send_webhook(payload, token=None):
    if token is None:
        token = f"Bearer {WEBHOOK_SECRET}"
    headers = {"Authorization": token}
    response = httpx.post(WEBHOOK_URL, json=payload, headers=headers)
    return response

async def verify_db(event_id, expected_status=None, expected_will_renew=None, expected_event_result=None):
    if not DATABASE_URL:
        print("WARNING: DATABASE_URL not set, skipping DB verification.")
        return
        
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check event
        event = await conn.fetchrow("SELECT * FROM revenuecat_events WHERE event_id = $1", event_id)
        assert event is not None, f"Event {event_id} not found in DB"
        if expected_event_result:
            assert event['processing_result'] == expected_event_result, f"Expected event result {expected_event_result}, got {event['processing_result']}"
            assert event['event_type'] is not None, "event_type not saved"
            assert event['app_user_id'] == TEST_USER_ID, "app_user_id not saved correctly"
            
        # Check subscription
        sub = await conn.fetchrow("SELECT * FROM subscriptions WHERE user_id = $1 AND entitlement_id = 'rivals_plus'", TEST_USER_ID)
        if expected_status:
            assert sub is not None, "Subscription not found"
            assert sub['status'] == expected_status, f"Expected status {expected_status}, got {sub['status']}"
            assert sub['will_renew'] == expected_will_renew, f"Expected will_renew {expected_will_renew}, got {sub['will_renew']}"
            assert sub['environment'] == 'sandbox', "Environment should be sandbox"
            assert sub['product_id'] == 'rivals_plus_monthly', "Product ID mismatch"
    finally:
        await conn.close()

async def run_tests():
    print(f"Targeting WEBHOOK_URL: {WEBHOOK_URL}")
    print(f"Using TEST_USER_ID: {TEST_USER_ID}")

    if PRODUCTION_SMOKE_TEST:
        # Phase 6: Production Smoke Test Mode (Single INITIAL_PURCHASE)
        event_id = str(uuid.uuid4())
        print(f"\n[PRODUCTION SMOKE TEST] Sending INITIAL_PURCHASE (Event: {event_id})")
        payload = generate_payload("INITIAL_PURCHASE", event_id=event_id)
        resp = send_webhook(payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        print("Waiting a moment for DB async commit...")
        await asyncio.sleep(2)
        await verify_db(event_id, "active", True, "processed")
        print("Production Smoke Test PASSED.")
        return

    # Normal Test Mode
    # Phase 6: Security Tests
    print("\n--- Running Security Tests ---")
    payload = generate_payload("INITIAL_PURCHASE")
    print("Testing missing auth...")
    resp = httpx.post(WEBHOOK_URL, json=payload)
    assert resp.status_code == 401
    
    print("Testing bad auth...")
    resp = send_webhook(payload, token="Bearer invalid_secret")
    assert resp.status_code == 401
    
    print("Testing malformed payload...")
    resp = send_webhook({"bad": "data"})
    assert resp.status_code == 422
    
    # Phase 3: Verify INITIAL_PURCHASE
    print("\n--- Running Lifecycle & Idempotency Tests ---")
    event_id_1 = str(uuid.uuid4())
    print(f"Testing INITIAL_PURCHASE (Event: {event_id_1})...")
    payload_1 = generate_payload("INITIAL_PURCHASE", event_id=event_id_1)
    resp = send_webhook(payload_1)
    assert resp.status_code == 200
    await verify_db(event_id_1, "active", True, "processed")
    
    # Phase 4: Test Idempotency
    print("Testing Idempotency (same event ID)...")
    resp = send_webhook(payload_1)
    assert resp.status_code == 200
    assert resp.json()["status"] == "already_processed"
    await verify_db(event_id_1, "active", True, "processed") # unchanged
    
    # Phase 5: Test Lifecycle Transitions
    event_id_2 = str(uuid.uuid4())
    print(f"Testing CANCELLATION (Event: {event_id_2})...")
    payload_2 = generate_payload("CANCELLATION", event_id=event_id_2)
    resp = send_webhook(payload_2)
    assert resp.status_code == 200
    await verify_db(event_id_2, "active", False, "processed")
    
    event_id_3 = str(uuid.uuid4())
    print(f"Testing UNCANCELLATION (Event: {event_id_3})...")
    payload_3 = generate_payload("UNCANCELLATION", event_id=event_id_3)
    resp = send_webhook(payload_3)
    assert resp.status_code == 200
    await verify_db(event_id_3, "active", True, "processed")
    
    event_id_4 = str(uuid.uuid4())
    print(f"Testing BILLING_ISSUE (Event: {event_id_4})...")
    payload_4 = generate_payload("BILLING_ISSUE", event_id=event_id_4)
    resp = send_webhook(payload_4)
    assert resp.status_code == 200
    await verify_db(event_id_4, "past_due", True, "processed")
    
    event_id_5 = str(uuid.uuid4())
    print(f"Testing RENEWAL (Event: {event_id_5})...")
    payload_5 = generate_payload("RENEWAL", event_id=event_id_5)
    resp = send_webhook(payload_5)
    assert resp.status_code == 200
    await verify_db(event_id_5, "active", True, "processed")
    
    event_id_6 = str(uuid.uuid4())
    print(f"Testing EXPIRATION (Event: {event_id_6})...")
    payload_6 = generate_payload("EXPIRATION", event_id=event_id_6)
    resp = send_webhook(payload_6)
    assert resp.status_code == 200
    await verify_db(event_id_6, "expired", False, "processed")
    
    print("\nAll synthetic lifecycle tests PASSED.")

if __name__ == "__main__":
    asyncio.run(run_tests())
