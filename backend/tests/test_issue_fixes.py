import pytest
from uuid import uuid4
import asyncio
from unittest.mock import AsyncMock, Mock
from datetime import datetime, timezone, timedelta

# Mocks
class AsyncContextManagerMock:
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass

# 1. GROUP ARENA & START ENFORCEMENT
def test_start_arena_participant_count_enforcement():
    from app.services.arena_service import ArenaService
    from app.core.errors import ConflictError

    conn_mock = AsyncMock()
    conn_mock.transaction = Mock(return_value=AsyncContextManagerMock())
    service = ArenaService(conn_mock)

    arena_id = uuid4()
    user_id = str(uuid4())

    arena_mock = Mock()
    arena_mock.host_user_id = arena_id.__class__(user_id)
    arena_mock.status = 'pending'

    service.arena_repo.get_arena = AsyncMock(return_value=arena_mock)

    # Test host + pending invite -> ConflictError
    invited_mock = Mock()
    invited_mock.status = 'invited'
    host_mock = Mock()
    host_mock.status = 'active'

    service.participant_repo.get_participants_for_arena = AsyncMock(return_value=[host_mock, invited_mock])

    with pytest.raises(ConflictError, match="At least 2 joined participants"):
        asyncio.run(service.start_arena(arena_id, user_id))

    # Test host + joined participant -> Success
    joined_mock = Mock()
    joined_mock.status = 'active'
    service.participant_repo.get_participants_for_arena = AsyncMock(return_value=[host_mock, joined_mock])
    service.arena_repo.update_arena_status = AsyncMock()
    service.round_repo.get_rounds_for_arena = AsyncMock(return_value=[])

    asyncio.run(service.start_arena(arena_id, user_id))

def test_start_arena_host_enforcement():
    from app.services.arena_service import ArenaService
    from app.core.errors import ForbiddenError

    conn_mock = AsyncMock()
    conn_mock.transaction = Mock(return_value=AsyncContextManagerMock())
    service = ArenaService(conn_mock)

    arena_id = uuid4()
    user_id = str(uuid4())

    arena_mock = Mock()
    arena_mock.host_user_id = arena_id.__class__(user_id)
    arena_mock.status = 'pending'

    service.arena_repo.get_arena = AsyncMock(return_value=arena_mock)
    service.participant_repo.get_participants_for_arena = AsyncMock(return_value=[Mock(status='active'), Mock(status='active')])

    with pytest.raises(ForbiddenError, match="Only the host"):
        asyncio.run(service.start_arena(arena_id, str(uuid4())))

# 2. ECONOMY INITIALIZATION (100 coins)
def test_new_user_gets_100_coins():
    from app.services.coin_service import CoinService
    from app.schemas.coin import CoinLedgerType, CoinLedgerReason

    conn_mock = AsyncMock()
    conn_mock.transaction = Mock(return_value=AsyncContextManagerMock())
    service = CoinService(conn_mock)
    user_id = str(uuid4())

    # Mock no prior transactions
    service.coin_repo.get_transactions = AsyncMock(side_effect=[[], []])
    service.coin_repo.get_balance = AsyncMock(return_value=100)
    service.coin_repo.insert_ledger_entry = AsyncMock()
    service._lock_user = AsyncMock()

    balance = asyncio.run(service.get_balance(user_id))

    # Verify the lock was acquired
    service._lock_user.assert_called_once_with(user_id)

    # Should insert exact entry
    service.coin_repo.insert_ledger_entry.assert_called_once_with(
        user_id=user_id,
        type=CoinLedgerType.credit,
        reason=CoinLedgerReason.admin_adjustment,
        amount=100,
        balance_after=100
    )
    assert balance == 100

def test_existing_user_idempotency():
    from app.services.coin_service import CoinService

    conn_mock = AsyncMock()
    service = CoinService(conn_mock)
    user_id = str(uuid4())

    # Mock existing transactions (user already initialized)
    service.coin_repo.get_transactions = AsyncMock(return_value=[Mock()])
    service.coin_repo.get_balance = AsyncMock(return_value=50)
    service.coin_repo.insert_ledger_entry = AsyncMock()

    balance = asyncio.run(service.get_balance(user_id))

    # Should NOT insert anything
    service.coin_repo.insert_ledger_entry.assert_not_called()
    assert balance == 50

# 3. INVITES
def test_sender_cannot_accept_invite():
    from app.services.invite_service import InviteService
    from app.core.errors import ForbiddenError

    conn_mock = AsyncMock()
    service = InviteService(conn_mock)
    invite_id = uuid4()
    sender_id = str(uuid4())

    invite_mock = Mock()
    invite_mock.sender_id = uuid4().__class__(sender_id)
    invite_mock.status = 'pending'
    service.invite_repo.get_invite = AsyncMock(return_value=invite_mock)

    with pytest.raises(ForbiddenError, match="Not authorized to respond to this invite"):
        asyncio.run(service.respond_to_invite(invite_id, sender_id, True))

def test_stale_invite_cannot_be_acted_upon():
    from app.services.invite_service import InviteService
    from app.core.errors import ConflictError

    conn_mock = AsyncMock()
    service = InviteService(conn_mock)
    invite_id = uuid4()
    recipient_id = str(uuid4())

    invite_mock = Mock()
    invite_mock.invitee_id = uuid4().__class__(recipient_id)
    invite_mock.status = 'accepted' # already resolved
    service.invite_repo.get_invite = AsyncMock(return_value=invite_mock)

    with pytest.raises(ConflictError, match="Invite is no longer pending"):
        asyncio.run(service.respond_to_invite(invite_id, recipient_id, True))

def test_valid_recipient_can_respond():
    from app.services.invite_service import InviteService

    conn_mock = AsyncMock()
    conn_mock.transaction = Mock(return_value=AsyncContextManagerMock())
    service = InviteService(conn_mock)
    invite_id = uuid4()
    recipient_id = str(uuid4())

    invite_mock = Mock()
    invite_mock.invitee_id = uuid4().__class__(recipient_id)
    invite_mock.status = 'pending'
    invite_mock.arena_id = uuid4()
    invite_mock.expires_at = datetime.now(timezone.utc) + timedelta(days=1)

    service.invite_repo.get_invite = AsyncMock(return_value=invite_mock)
    service.invite_repo.update_invite_status = AsyncMock()
    service.arena_repo.get_arena = AsyncMock(return_value=Mock(max_participants=8))
    service.participant_repo.update_participant_status = AsyncMock()
    service.participant_repo.get_participants_for_arena = AsyncMock(return_value=[])
    service.participant_repo.create_participant = AsyncMock()

    asyncio.run(service.respond_to_invite(invite_id, recipient_id, True))
    service.invite_repo.update_invite_status.assert_called_once_with(invite_id, 'accepted')

# 4. ROUND STATE / ATTEMPTS
def test_duplicate_submission_prevented():
    from app.services.attempt_service import AttemptService
    from app.core.errors import ConflictError

    conn_mock = AsyncMock()
    conn_mock.transaction = Mock(return_value=AsyncContextManagerMock())
    service = AttemptService(conn_mock)

    attempt_mock = Mock()
    attempt_mock.status = 'submitted'

    arena_id = uuid4()
    round_id = uuid4()
    user_id = str(uuid4())

    service.arena_repo.get_arena = AsyncMock(return_value=Mock(id=arena_id))
    service.participant_repo.get_participant = AsyncMock(return_value=Mock(status='active'))
    service.round_repo.get_round = AsyncMock(return_value=Mock(status='active', arena_id=arena_id, ends_at=datetime.now(timezone.utc) + timedelta(minutes=1)))

    service.attempt_repo.get_attempts_for_user = AsyncMock(return_value=[attempt_mock])

    with pytest.raises(ConflictError, match="Attempt is already in terminal state"):
        asyncio.run(service.create_attempt(arena_id, round_id, user_id, Mock()))
