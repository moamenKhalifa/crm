from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, Protocol
from uuid import UUID

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.entities.refresh_token import RefreshToken
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User

# `ListQuery`/`SortDir` live here (not in `application/dto.py`) because they
# appear in the `list_paged` port signatures below, and this codebase's
# dependency direction is application -> domain, never the reverse. The
# application layer's `dto.py` re-exports these two names so use cases and
# routers can import them from the usual DTO module.
SortDir = Literal["asc", "desc"]


@dataclass(frozen=True)
class ListQuery:
    limit: int = 25
    offset: int = 0
    q: str | None = None
    sort_by: str | None = None
    sort_dir: SortDir = "asc"
    # Every filter value is carried as a tuple of strings for uniformity
    # across filter kinds (repeatable UUIDs, a single boolean, etc.); each
    # repository interprets its own keys. Booleans are encoded as the
    # lowercase strings "true"/"false".
    filters: dict[str, tuple[str, ...]] = field(default_factory=dict)


class UserRepository(Protocol):
    async def add(self, user: User) -> None: ...

    async def update(self, user: User) -> None: ...

    async def delete(self, user_id: UUID) -> None: ...

    async def find_by_id(self, user_id: UUID) -> User | None: ...

    async def find_by_email(self, email: str) -> User | None: ...

    async def find_by_ids(self, user_ids: set[UUID]) -> list[User]: ...

    async def list_all(self, limit: int, offset: int) -> list[User]: ...

    async def list_paged(self, query: ListQuery) -> tuple[list[User], int]: ...


class RoleRepository(Protocol):
    async def add(self, role: Role) -> None: ...

    async def update(self, role: Role) -> None: ...

    async def delete(self, role_id: UUID) -> None: ...

    async def find_by_id(self, role_id: UUID) -> Role | None: ...

    async def find_by_name(self, name: str) -> Role | None: ...

    async def find_by_ids(self, role_ids: set[UUID]) -> list[Role]: ...

    async def list_all(self, limit: int, offset: int) -> list[Role]: ...

    async def list_paged(self, query: ListQuery) -> tuple[list[Role], int]: ...


class PermissionRepository(Protocol):
    async def add(self, permission: Permission) -> None: ...

    async def update(self, permission: Permission) -> None: ...

    async def delete(self, permission_id: UUID) -> None: ...

    async def find_by_id(self, permission_id: UUID) -> Permission | None: ...

    async def find_by_code(self, code: str) -> Permission | None: ...

    async def find_by_ids(self, permission_ids: set[UUID]) -> list[Permission]: ...

    async def list_all(self, limit: int, offset: int) -> list[Permission]: ...

    async def list_paged(self, query: ListQuery) -> tuple[list[Permission], int]: ...


class RefreshTokenRepository(Protocol):
    async def add(self, token: RefreshToken) -> None: ...

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None: ...

    async def revoke(self, token_id: UUID, revoked_at: datetime) -> None: ...

    async def revoke_all_for_user(self, user_id: UUID, revoked_at: datetime) -> None: ...
