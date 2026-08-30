from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: UUID
    email: str
    roles: list[str]
    permissions: list[str]
    issued_at: datetime
    expires_at: datetime


class TokenExpiredError(Exception):
    """Raised by an AccessTokenIssuer when decoding an expired token."""


class TokenInvalidError(Exception):
    """Raised by an AccessTokenIssuer when decoding a malformed/tampered token."""


class AccessTokenIssuer(Protocol):
    def encode(
        self, *, user_id: UUID, email: str, roles: list[str], permissions: list[str]
    ) -> str: ...

    def decode(self, token: str) -> AccessTokenClaims: ...


@dataclass(frozen=True)
class IssuedRefreshToken:
    plaintext: str
    token_hash: str
    issued_at: datetime
    expires_at: datetime


class RefreshTokenIssuer(Protocol):
    def issue(self) -> IssuedRefreshToken: ...

    def hash(self, plaintext: str) -> str: ...
