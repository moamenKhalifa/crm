from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.refresh_token import RefreshToken
from app.modules.identity_access.infrastructure.orm.models import RefreshTokenModel
from app.modules.identity_access.infrastructure.time_utils import ensure_utc


def _to_entity(model: RefreshTokenModel) -> RefreshToken:
    return RefreshToken(
        id=model.id,
        user_id=model.user_id,
        token_hash=model.token_hash,
        issued_at=ensure_utc(model.issued_at),
        expires_at=ensure_utc(model.expires_at),
        revoked_at=ensure_utc(model.revoked_at),
    )


class SqlAlchemyRefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, token: RefreshToken) -> None:
        model = RefreshTokenModel(
            id=token.id,
            user_id=token.user_id,
            token_hash=token.token_hash,
            issued_at=token.issued_at,
            expires_at=token.expires_at,
            revoked_at=token.revoked_at,
        )
        self._session.add(model)
        await self._session.flush()

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        )
        model = result.scalar_one_or_none()
        return _to_entity(model) if model is not None else None

    async def revoke(self, token_id: UUID, revoked_at: datetime) -> None:
        await self._session.execute(
            update(RefreshTokenModel).where(RefreshTokenModel.id == token_id).values(revoked_at=revoked_at)
        )
        await self._session.flush()

    async def revoke_all_for_user(self, user_id: UUID, revoked_at: datetime) -> None:
        await self._session.execute(
            update(RefreshTokenModel)
            .where(RefreshTokenModel.user_id == user_id, RefreshTokenModel.revoked_at.is_(None))
            .values(revoked_at=revoked_at)
        )
        await self._session.flush()
