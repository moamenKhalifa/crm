from uuid import uuid4

import pytest

from app.modules.identity_access.application.use_cases.login import Login, LoginCommand
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import InvalidCredentialsError

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


def _build(*, user_repo=None, hasher=None, clock=None) -> Login:
    clock = clock or FrozenClock()
    return Login(
        user_repo=user_repo or FakeUserRepository(),
        role_repo=FakeRoleRepository(),
        permission_repo=FakePermissionRepository(),
        refresh_repo=FakeRefreshTokenRepository(),
        hasher=hasher or FakePasswordHasher(),
        access_issuer=FakeAccessTokenIssuer(clock),
        refresh_issuer=FakeRefreshTokenIssuer(clock),
        clock=clock,
        access_ttl_seconds=900,
        refresh_ttl_seconds=1_209_600,
    )


async def _seed_user(user_repo, hasher, clock, email="user@example.com", password="Passw0rd!") -> User:
    user = User(
        id=uuid4(),
        email=email,
        hashed_password=hasher.hash(password),
        full_name="Someone",
        is_active=True,
        is_customer=True,
        created_at=clock.now(),
        updated_at=clock.now(),
        role_ids=set(),
    )
    await user_repo.add(user)
    return user


async def test_login_success_returns_tokens_and_user():
    user_repo, hasher, clock = FakeUserRepository(), FakePasswordHasher(), FrozenClock()
    user = await _seed_user(user_repo, hasher, clock)
    use_case = _build(user_repo=user_repo, hasher=hasher, clock=clock)

    result = await use_case.execute(LoginCommand(email=user.email, password="Passw0rd!"))

    assert result.tokens.access_token
    assert result.tokens.refresh_token
    assert result.user.email == user.email


async def test_login_wrong_password_raises_invalid_credentials():
    user_repo, hasher, clock = FakeUserRepository(), FakePasswordHasher(), FrozenClock()
    user = await _seed_user(user_repo, hasher, clock)
    use_case = _build(user_repo=user_repo, hasher=hasher, clock=clock)

    with pytest.raises(InvalidCredentialsError):
        await use_case.execute(LoginCommand(email=user.email, password="WrongPass1"))


async def test_login_unknown_email_raises_same_error():
    with pytest.raises(InvalidCredentialsError):
        await _build().execute(LoginCommand(email="ghost@example.com", password="Passw0rd!"))


async def test_login_still_calls_hasher_for_unknown_email():
    calls = []

    class SpyHasher(FakePasswordHasher):
        def verify(self, raw, hashed):
            calls.append((raw, hashed))
            return super().verify(raw, hashed)

    use_case = _build(hasher=SpyHasher())
    with pytest.raises(InvalidCredentialsError):
        await use_case.execute(LoginCommand(email="ghost@example.com", password="Passw0rd!"))

    assert len(calls) == 1  # verify() still ran, against a dummy hash — timing-attack mitigation
