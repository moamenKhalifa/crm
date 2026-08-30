from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


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
