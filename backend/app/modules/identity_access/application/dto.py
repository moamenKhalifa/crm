from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar
from uuid import UUID

# Re-exported so use cases and routers can import the query DTO from the
# usual application-layer `dto` module without reaching into `domain.ports`
# directly. Defined in `domain/ports/repositories.py` (not here) because it
# appears in the repository port signatures, and this codebase's dependency
# direction is application -> domain, never the reverse.
from app.modules.identity_access.domain.ports.repositories import ListQuery, SortDir

__all__ = [
    "ListQuery",
    "LoginResult",
    "PagedResult",
    "PermissionSummary",
    "RoleSummary",
    "SortDir",
    "TokenPair",
    "UserSummary",
]

TItem = TypeVar("TItem")


@dataclass(frozen=True)
class PagedResult(Generic[TItem]):
    items: list[TItem]
    total: int


@dataclass(frozen=True)
class RoleSummary:
    id: UUID
    name: str
    description: str | None


@dataclass(frozen=True)
class PermissionSummary:
    id: UUID
    code: str
    description: str | None


@dataclass(frozen=True)
class UserSummary:
    id: UUID
    email: str
    full_name: str
    is_active: bool
    is_customer: bool
    roles: list[RoleSummary]


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    access_expires_in: int
    refresh_expires_in: int


@dataclass(frozen=True)
class LoginResult:
    tokens: TokenPair
    user: UserSummary
