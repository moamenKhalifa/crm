from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.modules.identity_access.domain.entities.refresh_token import RefreshToken
from app.modules.identity_access.domain.errors import InvalidCredentialsError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.hashing import PasswordHasher
from app.modules.identity_access.domain.ports.repositories import (
    PermissionRepository,
    RefreshTokenRepository,
    RoleRepository,
    UserRepository,
)
from app.modules.identity_access.domain.ports.tokens import AccessTokenIssuer, RefreshTokenIssuer

from ..authorization import resolve_effective_permissions_for_roles
from ..dto import LoginResult, TokenPair, UserSummary
from ..mappers import to_role_summary

# A bcrypt-shaped constant so `hasher.verify` still does a full comparison
# for an unknown email — prevents timing-based user enumeration.
_DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8i54XxA/exz6d3q0hVj0v1DZ7C6Vp."


@dataclass(frozen=True)
class LoginCommand:
    email: str
    password: str


class Login:
    def __init__(
        self,
        user_repo: UserRepository,
        role_repo: RoleRepository,
        permission_repo: PermissionRepository,
        refresh_repo: RefreshTokenRepository,
        hasher: PasswordHasher,
        access_issuer: AccessTokenIssuer,
        refresh_issuer: RefreshTokenIssuer,
        clock: Clock,
        access_ttl_seconds: int,
        refresh_ttl_seconds: int,
    ) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._permission_repo = permission_repo
        self._refresh_repo = refresh_repo
        self._hasher = hasher
        self._access_issuer = access_issuer
        self._refresh_issuer = refresh_issuer
        self._clock = clock
        self._access_ttl_seconds = access_ttl_seconds
        self._refresh_ttl_seconds = refresh_ttl_seconds

    async def execute(self, command: LoginCommand) -> LoginResult:
        user = await self._user_repo.find_by_email(command.email.strip().lower())

        # Always run verify() — even against a dummy hash for an unknown
        # email — so a missing account and a wrong password take the same
        # amount of time and raise the identical error (AC-12).
        password_ok = self._hasher.verify(
            command.password, user.hashed_password if user is not None else _DUMMY_HASH
        )
        if user is None or not user.is_active or not password_ok:
            raise InvalidCredentialsError("Invalid email or password.")

        roles = await self._role_repo.find_by_ids(user.role_ids)
        permission_codes = await resolve_effective_permissions_for_roles(roles, self._permission_repo)
        role_names = [role.name for role in roles]

        access_token = self._access_issuer.encode(
            user_id=user.id,
            email=user.email,
            roles=role_names,
            permissions=sorted(permission_codes),
        )
        issued_refresh = self._refresh_issuer.issue()
        await self._refresh_repo.add(
            RefreshToken(
                id=uuid4(),
                user_id=user.id,
                token_hash=issued_refresh.token_hash,
                issued_at=issued_refresh.issued_at,
                expires_at=issued_refresh.expires_at,
                revoked_at=None,
            )
        )

        return LoginResult(
            tokens=TokenPair(
                access_token=access_token,
                refresh_token=issued_refresh.plaintext,
                access_expires_in=self._access_ttl_seconds,
                refresh_expires_in=self._refresh_ttl_seconds,
            ),
            user=UserSummary(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_customer=user.is_customer,
                roles=[to_role_summary(role) for role in roles],
            ),
        )
