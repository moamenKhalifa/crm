from datetime import timedelta
from uuid import uuid4

import pytest

from app.modules.identity_access.application.use_cases.refresh_token import (
    RefreshToken as RefreshTokenUseCase,
)
from app.modules.identity_access.application.use_cases.refresh_token import RefreshTokenCommand
from app.modules.identity_access.domain.entities.refresh_token import RefreshToken as RefreshTokenEntity
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import (
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError,
)

from ..fakes import (
    FakeAccessTokenIssuer,
    FakePasswordHasher,
    FakePermissionRepository,
    FakeRefreshTokenIssuer,
    FakeRefreshTokenRepository,
    FakeRoleRepository,
    FakeUserRepository,
    FrozenClock,
)


def _build(refresh_repo, user_repo, clock) -> RefreshTokenUseCase:
    return RefreshTokenUseCase(
        refresh_repo=refresh_repo,
        user_repo=user_repo,
        role_repo=FakeRoleRepository(),
        permission_repo=FakePermissionRepository(),
        access_issuer=FakeAccessTokenIssuer(clock),
        refresh_issuer=FakeRefreshTokenIssuer(clock),
        clock=clock,
        access_ttl_seconds=900,
        refresh_ttl_seconds=1_209_600,
    )


async def _seed(refresh_repo, user_repo, clock, *, expired=False):
    hasher = FakePasswordHasher()
    user = User(
        id=uuid4(),
        email="user@example.com",
        hashed_password=hasher.hash("Passw0rd!"),
        full_name="U",
        is_active=True,
        is_customer=True,
        created_at=clock.now(),
        updated_at=clock.now(),
        role_ids=set(),
    )
    await user_repo.add(user)

    # Seeded by hand (not via `.issue()`) so its plaintext can never collide
    # with a token the use case itself mints from a separate fake issuer
    # instance (each `FakeRefreshTokenIssuer` counts from 1 independently).
    plaintext = "seed-refresh-token"
    token_hash = FakeRefreshTokenIssuer(clock).hash(plaintext)
    now = clock.now()
    expires_at = now - timedelta(seconds=1) if expired else now + timedelta(seconds=1_209_600)
    token = RefreshTokenEntity(
        id=uuid4(),
        user_id=user.id,
        token_hash=token_hash,
        issued_at=now,
        expires_at=expires_at,
        revoked_at=None,
    )
    await refresh_repo.add(token)
    return user, plaintext, token


async def test_refresh_success_rotates_token():
    clock = FrozenClock()
    refresh_repo, user_repo = FakeRefreshTokenRepository(), FakeUserRepository()
    _user, plaintext, token = await _seed(refresh_repo, user_repo, clock)
    use_case = _build(refresh_repo, user_repo, clock)

    result = await use_case.execute(RefreshTokenCommand(refresh_token=plaintext))

    assert result.access_token
    assert result.refresh_token != plaintext
    stored = await refresh_repo.find_by_hash(token.token_hash)
    assert stored.revoked_at is not None


async def test_refresh_expired_token_raises():
    clock = FrozenClock()
    refresh_repo, user_repo = FakeRefreshTokenRepository(), FakeUserRepository()
    _user, plaintext, _token = await _seed(refresh_repo, user_repo, clock, expired=True)
    use_case = _build(refresh_repo, user_repo, clock)

    with pytest.raises(RefreshTokenExpiredError):
        await use_case.execute(RefreshTokenCommand(refresh_token=plaintext))


async def test_refresh_revoked_token_raises():
    clock = FrozenClock()
    refresh_repo, user_repo = FakeRefreshTokenRepository(), FakeUserRepository()
    _user, plaintext, token = await _seed(refresh_repo, user_repo, clock)
    await refresh_repo.revoke(token.id, clock.now())
    use_case = _build(refresh_repo, user_repo, clock)

    with pytest.raises(RefreshTokenRevokedError):
        await use_case.execute(RefreshTokenCommand(refresh_token=plaintext))


async def test_refresh_unknown_hash_raises():
    clock = FrozenClock()
    use_case = _build(FakeRefreshTokenRepository(), FakeUserRepository(), clock)

    with pytest.raises(RefreshTokenInvalidError):
        await use_case.execute(RefreshTokenCommand(refresh_token="never-issued"))
