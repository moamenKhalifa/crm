from __future__ import annotations

from typing import Awaitable, Callable
from typing import AsyncIterator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.application.authorization import resolve_effective_permissions
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.ports.tokens import TokenExpiredError, TokenInvalidError
from app.modules.identity_access.infrastructure.composition import (
    build_access_issuer,
    build_clock,
    build_permission_repo,
    build_role_repo,
    build_user_repo,
)
from app.shared.config.settings import Settings, get_settings
from app.shared.infrastructure.database import get_session

# `auto_error=False` so a missing Authorization header falls through to our
# own 401 envelope instead of FastAPI's default plain 403.
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async for session in get_session():
        yield session


def _unauthenticated(code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": code, "message": message})


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> User:
    if credentials is None:
        raise _unauthenticated("unauthenticated", "Authentication is required.")

    clock = build_clock()
    access_issuer = build_access_issuer(settings, clock)
    try:
        claims = access_issuer.decode(credentials.credentials)
    except TokenExpiredError as exc:
        raise _unauthenticated("token_expired", "Access token has expired.") from exc
    except TokenInvalidError as exc:
        raise _unauthenticated("unauthenticated", "Access token is invalid.") from exc

    user_repo = build_user_repo(session)
    user = await user_repo.find_by_id(claims.user_id)
    if user is None or not user.is_active:
        raise _unauthenticated("unauthenticated", "Access token does not match an active user.")

    return user


def require_permission(code: str) -> Callable[..., Awaitable[User]]:
    """Factory: returns a dependency that re-resolves the caller's effective
    permissions live from the database on every call (not from JWT claims),
    so a role/permission change takes effect immediately."""

    async def dependency(
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db_session),
    ) -> User:
        role_repo = build_role_repo(session)
        permission_repo = build_permission_repo(session)
        effective_permissions = await resolve_effective_permissions(user, role_repo, permission_repo)
        if code not in effective_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "insufficient_permissions",
                    "message": f"Missing required permission: {code}",
                },
            )
        return user

    return dependency
