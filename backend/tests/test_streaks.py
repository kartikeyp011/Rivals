import pytest
import asyncio
from httpx import AsyncClient
from uuid import uuid4
import asyncpg
from datetime import datetime, timezone
from app.core.config import settings
from unittest.mock import patch

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

def test_streak_increment_and_recovery(client, test_user_1, test_user_1_headers):
    # Set timezone for test user
    async def setup_profile():
        conn = await asyncpg.connect(settings.DATABASE_URL)
        await conn.execute("UPDATE profiles SET timezone = 'America/New_York' WHERE id = $1", test_user_1)
        await conn.close()
        
    asyncio.run(setup_profile())
    
    # 1. Check initial streak
    res = client.get("/api/v1/streaks/me", headers=test_user_1_headers)
    assert res.status_code == 200
    assert res.json()["current_streak"] == 0
    assert res.json()["free_recovery_available"] == True
    
    # 2. Try to recover (should fail because streak hasn't even started or isn't broken)
    res = client.post("/api/v1/streaks/recover", headers=test_user_1_headers)
    assert res.status_code == 400
    assert "no recovery needed" in res.json()["detail"].lower()
    
    # We will test update_streak directly via unit tests or patch datetime
    async def force_streak(current, longest, date_str):
        conn = await asyncpg.connect(settings.DATABASE_URL)
        from app.services.streak_service import StreakService
        service = StreakService(conn)
        from datetime import datetime
        await service.repo.update_streak(test_user_1, current, longest, datetime.strptime(date_str, "%Y-%m-%d").date())
        await conn.close()
        
    # Simulate playing 3 days ago
    asyncio.run(force_streak(3, 3, "2026-09-09"))
    
    # Now it's 2026-09-12. The streak is broken! 
    # Let's try to recover it
    with patch('app.routers.streaks.datetime') as mock_datetime:
        mock_datetime.now.return_value = datetime(2026, 9, 12, 12, 0, tzinfo=timezone.utc)
        res = client.post("/api/v1/streaks/recover", headers=test_user_1_headers)
        assert res.status_code == 200
        
    # It should have restored last_activity_date to yesterday (2026-09-11)
    res = client.get("/api/v1/streaks/me", headers=test_user_1_headers)
    assert res.json()["current_streak"] == 3
    assert res.json()["free_recovery_available"] == False
    assert res.json()["last_activity_date"] == "2026-09-11"
    
    # 3. Try to recover again (should fail)
    with patch('app.routers.streaks.datetime') as mock_datetime:
        mock_datetime.now.return_value = datetime(2026, 9, 12, 12, 0, tzinfo=timezone.utc)
        res = client.post("/api/v1/streaks/recover", headers=test_user_1_headers)
        assert res.status_code == 400
        assert "not available" in res.json()["detail"].lower()
