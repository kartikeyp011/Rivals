"""A cancelled arena must never advance rounds or award anything (no database needed)."""
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.scoring_service import ScoringService


class _FakeConn:
    def __init__(self, arena_status: str):
        self.arena_status = arena_status

    @asynccontextmanager
    async def transaction(self):
        yield

    async def fetchrow(self, sql, *args):
        # Locked round row: still 'active' with an already-expired timer
        return {"status": "active", "ends_at": datetime.now(timezone.utc) - timedelta(seconds=5)}

    async def fetchval(self, sql, *args):
        return self.arena_status

    async def execute(self, sql, *args):
        return "UPDATE 0"


@pytest.mark.asyncio
@pytest.mark.parametrize("arena_status", ["cancelled", "completed", "pending"])
async def test_round_timeout_does_not_advance_inactive_arena(arena_status):
    service = ScoringService(_FakeConn(arena_status))
    service.advance_round = AsyncMock()

    await service.check_round_complete(uuid4(), uuid4())

    service.advance_round.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("arena_status", ["cancelled", "completed"])
async def test_complete_arena_skips_finished_or_cancelled(arena_status):
    service = ScoringService(_FakeConn(arena_status))
    service.arena_repo = MagicMock()
    service.arena_repo.get_arena = AsyncMock(return_value=MagicMock(status=arena_status, category="daily"))
    service.score_repo = MagicMock()
    service.score_repo.get_scores_for_arena = AsyncMock()

    await service.complete_arena(uuid4())

    service.score_repo.get_scores_for_arena.assert_not_called()
