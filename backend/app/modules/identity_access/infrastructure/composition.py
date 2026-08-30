from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.hashing import PasswordHasher
from app.modules.identity_access.domain.ports.tokens import AccessTokenIssuer, RefreshTokenIssuer
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_permission_repository import (
    SqlAlchemyPermissionRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_refresh_token_repository import (
    SqlAlchemyRefreshTokenRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_role_repository import (
    SqlAlchemyRoleRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.modules.identity_access.infrastructure.security.jwt_access_token import PyJWTAccessTokenIssuer
from app.modules.identity_access.infrastructure.security.password_hasher import PasslibBcryptHasher
from app.modules.identity_access.infrastructure.security.refresh_token_service import (
    SecretsRefreshTokenIssuer,
)
from app.modules.identity_access.infrastructure.security.system_clock import SystemClock
from app.shared.config.settings import Settings


def build_clock() -> Clock:
    return SystemClock()


def build_password_hasher(settings: Settings) -> PasswordHasher:
    return PasslibBcryptHasher(rounds=settings.password_bcrypt_rounds)


def build_access_issuer(settings: Settings, clock: Clock) -> AccessTokenIssuer:
    return PyJWTAccessTokenIssuer(
        secret=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        ttl_seconds=settings.jwt_access_token_ttl_seconds,
        clock=clock,
    )


def build_refresh_issuer(settings: Settings, clock: Clock) -> RefreshTokenIssuer:
    return SecretsRefreshTokenIssuer(ttl_seconds=settings.jwt_refresh_token_ttl_seconds, clock=clock)


def build_user_repo(session: AsyncSession) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(session)


def build_role_repo(session: AsyncSession) -> SqlAlchemyRoleRepository:
    return SqlAlchemyRoleRepository(session)


def build_permission_repo(session: AsyncSession) -> SqlAlchemyPermissionRepository:
    return SqlAlchemyPermissionRepository(session)


def build_refresh_token_repo(session: AsyncSession) -> SqlAlchemyRefreshTokenRepository:
    return SqlAlchemyRefreshTokenRepository(session)
