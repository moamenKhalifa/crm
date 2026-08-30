from __future__ import annotations

from dataclasses import dataclass

from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.repositories import RefreshTokenRepository
from app.modules.identity_access.domain.ports.tokens import RefreshTokenIssuer


@dataclass(frozen=True)
class LogoutCommand:
    refresh_token: str


class Logout:
    def __init__(
        self,
        refresh_repo: RefreshTokenRepository,
        refresh_issuer: RefreshTokenIssuer,
        clock: Clock,
    ) -> None:
        self._refresh_repo = refresh_repo
        self._refresh_issuer = refresh_issuer
        self._clock = clock

    async def execute(self, command: LogoutCommand) -> None:
        token_hash = self._refresh_issuer.hash(command.refresh_token)
        token = await self._refresh_repo.find_by_hash(token_hash)
        if token is None or token.is_revoked:
            return  # idempotent: unknown or already-revoked tokens are a no-op
        await self._refresh_repo.revoke(token.id, self._clock.now())
