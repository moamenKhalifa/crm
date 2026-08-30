from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.modules.identity_access.domain.entities.refresh_token import (
    RefreshToken as RefreshTokenEntity,
)
from app.modules.identity_access.domain.errors import (
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError,
    UserNotFoundError,
)
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.repositories import (
    PermissionRepository,
    RefreshTokenRepository,
    RoleRepository,
    UserRepository,
)
from app.modules.identity_access.domain.ports.tokens import AccessTokenIssuer, RefreshTokenIssuer

from ..authorization import resolve_effective_permissions_for_roles
from ..dto import TokenPair


@dataclass(frozen=True)
class RefreshTokenCommand:
    refresh_token: str


class RefreshToken:
    def __init__(
        self,
        refresh_repo: RefreshTokenRepository,
        user_repo: UserRepository,
        role_repo: RoleRepository,
        permission_repo: PermissionRepository,
        access_issuer: AccessTokenIssuer,
        refresh_issuer: RefreshTokenIssuer,
        clock: Clock,
        access_ttl_seconds: int,
        refresh_ttl_seconds: int,
    ) -> None:
        self._refresh_repo = refresh_repo
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._permission_repo = permission_repo
        self._access_issuer = access_issuer
        self._refresh_issuer = refresh_issuer
        self._clock = clock
        self._access_ttl_seconds = access_ttl_seconds
        self._refresh_ttl_seconds = refresh_ttl_seconds

    async def execute(self, command: RefreshTokenCommand) -> TokenPair:
        presented_hash = self._refresh_issuer.hash(command.refresh_token)
        token = await self._refresh_repo.find_by_hash(presented_hash)
        if token is None:
            raise RefreshTokenInvalidError("Refresh token is invalid.")

        now = self._clock.now()
        if token.is_revoked:
            raise RefreshTokenRevokedError("Refresh token has been revoked.")
        if token.is_expired(now):
            raise RefreshTokenExpiredError("Refresh token has expired.")

        user = await self._user_repo.find_by_id(token.user_id)
        if user is None or not user.is_active:
            raise UserNotFoundError("User for this refresh token no longer exists.")

        # Rotation: revoke the presented token before minting the new pair so
        # a replayed copy of it is rejected as revoked, not silently reused.
        await self._refresh_repo.revoke(token.id, now)

        roles = await self._role_repo.find_by_ids(user.role_ids)
        permission_codes = await resolve_effective_permissions_for_roles(roles, self._permission_repo)

        access_token = self._access_issuer.encode(
            user_id=user.id,
            email=user.email,
            roles=[role.name for role in roles],
            permissions=sorted(permission_codes),
        )
        issued_refresh = self._refresh_issuer.issue()
        await self._refresh_repo.add(
            RefreshTokenEntity(
                id=uuid4(),
                user_id=user.id,
                token_hash=issued_refresh.token_hash,
                issued_at=issued_refresh.issued_at,
                expires_at=issued_refresh.expires_at,
                revoked_at=None,
            )
        )

        return TokenPair(
            access_token=access_token,
            refresh_token=issued_refresh.plaintext,
            access_expires_in=self._access_ttl_seconds,
            refresh_expires_in=self._refresh_ttl_seconds,
        )
