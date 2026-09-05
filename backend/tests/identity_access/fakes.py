"""In-memory fakes implementing the identity_access domain ports, for unit
tests of the application layer that must not touch a real database."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable
from uuid import UUID

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.entities.refresh_token import RefreshToken
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import (
    DuplicateAccountError,
    DuplicatePermissionError,
    DuplicateRoleError,
)
from app.modules.identity_access.domain.ports.repositories import ListQuery
from app.modules.identity_access.domain.ports.tokens import (
    AccessTokenClaims,
    IssuedRefreshToken,
    TokenInvalidError,
)

# Mirrors each SQLAlchemy repository's sort-column whitelist so behaviour
# matches between the fakes (used by application-layer tests) and the real
# repositories (used by infrastructure-layer tests).
_USER_SORT_KEYS: dict[str, Callable[[User], object]] = {
    "full_name": lambda u: u.full_name,
    "email": lambda u: u.email,
    "created_at": lambda u: u.created_at,
    "is_active": lambda u: u.is_active,
}
_ROLE_SORT_KEYS: dict[str, Callable[[Role], object]] = {"name": lambda r: r.name}
_PERMISSION_SORT_KEYS: dict[str, Callable[[Permission], object]] = {"code": lambda p: p.code}


class FrozenClock:
    def __init__(self, now: datetime | None = None) -> None:
        self._now = now or datetime(2026, 1, 1, tzinfo=timezone.utc)

    def now(self) -> datetime:
        return self._now

    def advance(self, **kwargs: float) -> None:
        self._now += timedelta(**kwargs)


class FakeUserRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, User] = {}

    async def add(self, user: User) -> None:
        if any(u.email == user.email for u in self._by_id.values()):
            raise DuplicateAccountError(f"duplicate {user.email}")
        self._by_id[user.id] = user

    async def update(self, user: User) -> None:
        self._by_id[user.id] = user

    async def delete(self, user_id: UUID) -> None:
        self._by_id.pop(user_id, None)

    async def find_by_id(self, user_id: UUID) -> User | None:
        return self._by_id.get(user_id)

    async def find_by_email(self, email: str) -> User | None:
        email = email.strip().lower()
        for user in self._by_id.values():
            if user.email == email:
                return user
        return None

    async def find_by_ids(self, user_ids: set[UUID]) -> list[User]:
        return [user for uid, user in self._by_id.items() if uid in user_ids]

    async def list_all(self, limit: int, offset: int) -> list[User]:
        return list(self._by_id.values())[offset : offset + limit]

    async def list_paged(self, query: ListQuery) -> tuple[list[User], int]:
        items = list(self._by_id.values())

        if query.q and len(query.q.strip()) >= 2:
            needle = query.q.strip().lower()
            items = [u for u in items if needle in u.full_name.lower() or needle in u.email.lower()]

        is_active_filter = query.filters.get("is_active")
        if is_active_filter:
            wanted_active = is_active_filter[0] == "true"
            items = [u for u in items if u.is_active == wanted_active]

        role_id_filter = query.filters.get("role_id")
        if role_id_filter:
            wanted_roles = {UUID(r) for r in role_id_filter}
            items = [u for u in items if u.role_ids & wanted_roles]

        sort_by = query.sort_by or "created_at"
        key_fn = _USER_SORT_KEYS.get(sort_by)
        if key_fn is None:
            raise ValueError(f"Unknown sort column: {query.sort_by}")
        items = sorted(items, key=key_fn, reverse=(query.sort_dir == "desc"))

        total = len(items)
        return items[query.offset : query.offset + query.limit], total


class FakeRoleRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, Role] = {}

    async def add(self, role: Role) -> None:
        if any(r.name == role.name for r in self._by_id.values()):
            raise DuplicateRoleError(f"duplicate {role.name}")
        self._by_id[role.id] = role

    async def update(self, role: Role) -> None:
        self._by_id[role.id] = role

    async def delete(self, role_id: UUID) -> None:
        self._by_id.pop(role_id, None)

    async def find_by_id(self, role_id: UUID) -> Role | None:
        return self._by_id.get(role_id)

    async def find_by_name(self, name: str) -> Role | None:
        for role in self._by_id.values():
            if role.name == name:
                return role
        return None

    async def find_by_ids(self, role_ids: set[UUID]) -> list[Role]:
        return [role for rid, role in self._by_id.items() if rid in role_ids]

    async def list_all(self, limit: int, offset: int) -> list[Role]:
        return list(self._by_id.values())[offset : offset + limit]

    async def list_paged(self, query: ListQuery) -> tuple[list[Role], int]:
        items = list(self._by_id.values())

        if query.q and len(query.q.strip()) >= 2:
            needle = query.q.strip().lower()
            items = [
                r
                for r in items
                if needle in r.name.lower() or (r.description is not None and needle in r.description.lower())
            ]

        has_permission_filter = query.filters.get("has_permission_id")
        if has_permission_filter:
            wanted_permissions = {UUID(p) for p in has_permission_filter}
            items = [r for r in items if r.permission_ids & wanted_permissions]

        sort_by = query.sort_by or "name"
        key_fn = _ROLE_SORT_KEYS.get(sort_by)
        if key_fn is None:
            raise ValueError(f"Unknown sort column: {query.sort_by}")
        items = sorted(items, key=key_fn, reverse=(query.sort_dir == "desc"))

        total = len(items)
        return items[query.offset : query.offset + query.limit], total


class FakePermissionRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, Permission] = {}

    async def add(self, permission: Permission) -> None:
        if any(p.code == permission.code for p in self._by_id.values()):
            raise DuplicatePermissionError(f"duplicate {permission.code}")
        self._by_id[permission.id] = permission

    async def update(self, permission: Permission) -> None:
        self._by_id[permission.id] = permission

    async def delete(self, permission_id: UUID) -> None:
        self._by_id.pop(permission_id, None)

    async def find_by_id(self, permission_id: UUID) -> Permission | None:
        return self._by_id.get(permission_id)

    async def find_by_code(self, code: str) -> Permission | None:
        for permission in self._by_id.values():
            if permission.code == code:
                return permission
        return None

    async def find_by_ids(self, permission_ids: set[UUID]) -> list[Permission]:
        return [p for pid, p in self._by_id.items() if pid in permission_ids]

    async def list_all(self, limit: int, offset: int) -> list[Permission]:
        return list(self._by_id.values())[offset : offset + limit]

    async def list_paged(self, query: ListQuery) -> tuple[list[Permission], int]:
        items = list(self._by_id.values())

        if query.q and len(query.q.strip()) >= 2:
            needle = query.q.strip().lower()
            items = [
                p
                for p in items
                if needle in p.code.lower() or (p.description is not None and needle in p.description.lower())
            ]

        sort_by = query.sort_by or "code"
        key_fn = _PERMISSION_SORT_KEYS.get(sort_by)
        if key_fn is None:
            raise ValueError(f"Unknown sort column: {query.sort_by}")
        items = sorted(items, key=key_fn, reverse=(query.sort_dir == "desc"))

        total = len(items)
        return items[query.offset : query.offset + query.limit], total


class FakeRefreshTokenRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, RefreshToken] = {}

    async def add(self, token: RefreshToken) -> None:
        self._by_id[token.id] = token

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        for token in self._by_id.values():
            if token.token_hash == token_hash:
                return token
        return None

    async def revoke(self, token_id: UUID, revoked_at: datetime) -> None:
        token = self._by_id.get(token_id)
        if token is not None:
            token.revoked_at = revoked_at

    async def revoke_all_for_user(self, user_id: UUID, revoked_at: datetime) -> None:
        for token in self._by_id.values():
            if token.user_id == user_id and token.revoked_at is None:
                token.revoked_at = revoked_at


class FakePasswordHasher:
    """Deterministic, non-bcrypt hasher — fast for unit tests that don't
    exercise the real hashing algorithm (see infrastructure tests for that)."""

    def hash(self, raw: str) -> str:
        return f"hashed:{raw}"

    def verify(self, raw: str, hashed: str) -> bool:
        return hashed == f"hashed:{raw}"


class FakeAccessTokenIssuer:
    def __init__(self, clock: FrozenClock, ttl_seconds: int = 900) -> None:
        self._clock = clock
        self._ttl_seconds = ttl_seconds
        self._issued: dict[str, AccessTokenClaims] = {}
        self._counter = 0

    def encode(
        self, *, user_id: UUID, email: str, roles: list[str], permissions: list[str]
    ) -> str:
        self._counter += 1
        token = f"access-token-{self._counter}"
        now = self._clock.now()
        self._issued[token] = AccessTokenClaims(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions,
            issued_at=now,
            expires_at=now + timedelta(seconds=self._ttl_seconds),
        )
        return token

    def decode(self, token: str) -> AccessTokenClaims:
        claims = self._issued.get(token)
        if claims is None:
            raise TokenInvalidError("unknown token")
        return claims


class FakeRefreshTokenIssuer:
    def __init__(self, clock: FrozenClock, ttl_seconds: int = 1_209_600) -> None:
        self._clock = clock
        self._ttl_seconds = ttl_seconds
        self._counter = 0

    def issue(self) -> IssuedRefreshToken:
        self._counter += 1
        plaintext = f"refresh-token-{self._counter}"
        now = self._clock.now()
        return IssuedRefreshToken(
            plaintext=plaintext,
            token_hash=self.hash(plaintext),
            issued_at=now,
            expires_at=now + timedelta(seconds=self._ttl_seconds),
        )

    def hash(self, plaintext: str) -> str:
        return f"hash:{plaintext}"
