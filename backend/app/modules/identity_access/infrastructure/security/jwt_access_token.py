from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import jwt

from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.tokens import (
    AccessTokenClaims,
    TokenExpiredError,
    TokenInvalidError,
)


class PyJWTAccessTokenIssuer:
    def __init__(self, secret: str, algorithm: str, ttl_seconds: int, clock: Clock) -> None:
        self._secret = secret
        self._algorithm = algorithm
        self._ttl_seconds = ttl_seconds
        self._clock = clock

    def encode(self, *, user_id: UUID, email: str, roles: list[str], permissions: list[str]) -> str:
        now = self._clock.now()
        payload = {
            "sub": str(user_id),
            "email": email,
            "roles": roles,
            "permissions": permissions,
            "iat": int(now.timestamp()),
            "exp": int(now.timestamp()) + self._ttl_seconds,
            "type": "access",
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def decode(self, token: str) -> AccessTokenClaims:
        # `verify_exp=False`: PyJWT's built-in expiry check always compares
        # against the real wall clock, which would silently bypass the
        # injected `Clock` port (and make expiry untestable without sleeping
        # for real). Expiry is checked manually below against `self._clock`
        # instead, so both production (SystemClock) and tests (FrozenClock)
        # get a single, consistent notion of "now".
        try:
            payload = jwt.decode(
                token, self._secret, algorithms=[self._algorithm], options={"verify_exp": False}
            )
        except jwt.InvalidTokenError as exc:
            raise TokenInvalidError("Access token is invalid.") from exc

        try:
            user_id = UUID(payload["sub"])
            email = payload["email"]
            roles = list(payload.get("roles", []))
            permissions = list(payload.get("permissions", []))
            issued_at = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
            expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        except (KeyError, ValueError) as exc:
            raise TokenInvalidError("Access token is missing required claims.") from exc

        if self._clock.now() >= expires_at:
            raise TokenExpiredError("Access token has expired.")

        return AccessTokenClaims(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions,
            issued_at=issued_at,
            expires_at=expires_at,
        )
