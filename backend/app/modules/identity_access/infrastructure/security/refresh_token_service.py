from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.tokens import IssuedRefreshToken


class SecretsRefreshTokenIssuer:
    def __init__(self, ttl_seconds: int, clock: Clock) -> None:
        self._ttl_seconds = ttl_seconds
        self._clock = clock

    def issue(self) -> IssuedRefreshToken:
        plaintext = secrets.token_urlsafe(64)
        now = self._clock.now()
        return IssuedRefreshToken(
            plaintext=plaintext,
            token_hash=self.hash(plaintext),
            issued_at=now,
            expires_at=now + timedelta(seconds=self._ttl_seconds),
        )

    def hash(self, plaintext: str) -> str:
        return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()
