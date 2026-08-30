from uuid import uuid4

from app.modules.identity_access.application.use_cases.logout import Logout, LogoutCommand
from app.modules.identity_access.domain.entities.refresh_token import RefreshToken

from ..fakes import FakeRefreshTokenIssuer, FakeRefreshTokenRepository, FrozenClock


async def _seeded_logout():
    clock = FrozenClock()
    refresh_repo = FakeRefreshTokenRepository()
    issuer = FakeRefreshTokenIssuer(clock)
    issued = issuer.issue()
    token = RefreshToken(
        id=uuid4(),
        user_id=uuid4(),
        token_hash=issued.token_hash,
        issued_at=issued.issued_at,
        expires_at=issued.expires_at,
        revoked_at=None,
    )
    await refresh_repo.add(token)
    return Logout(refresh_repo, issuer, clock), refresh_repo, issued.plaintext, issued.token_hash


async def test_logout_revokes_token():
    use_case, refresh_repo, plaintext, token_hash = await _seeded_logout()

    await use_case.execute(LogoutCommand(refresh_token=plaintext))

    stored = await refresh_repo.find_by_hash(token_hash)
    assert stored.revoked_at is not None


async def test_logout_idempotent_on_second_call():
    use_case, refresh_repo, plaintext, token_hash = await _seeded_logout()

    await use_case.execute(LogoutCommand(refresh_token=plaintext))
    await use_case.execute(LogoutCommand(refresh_token=plaintext))  # must not raise

    stored = await refresh_repo.find_by_hash(token_hash)
    assert stored.revoked_at is not None


async def test_logout_unknown_token_is_noop():
    clock = FrozenClock()
    use_case = Logout(FakeRefreshTokenRepository(), FakeRefreshTokenIssuer(clock), clock)

    await use_case.execute(LogoutCommand(refresh_token="never-issued"))  # must not raise
