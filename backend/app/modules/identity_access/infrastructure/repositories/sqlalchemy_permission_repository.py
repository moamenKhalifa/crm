from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.errors import DuplicatePermissionError
from app.modules.identity_access.infrastructure.orm.models import PermissionModel


def _to_entity(model: PermissionModel) -> Permission:
    return Permission(id=model.id, code=model.code, description=model.description)


class SqlAlchemyPermissionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, permission: Permission) -> None:
        model = PermissionModel(id=permission.id, code=permission.code, description=permission.description)
        self._session.add(model)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicatePermissionError(f"A permission coded {permission.code!r} already exists") from exc

    async def update(self, permission: Permission) -> None:
        model = await self._session.get(PermissionModel, permission.id)
        if model is None:
            return
        model.code = permission.code
        model.description = permission.description
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicatePermissionError(f"A permission coded {permission.code!r} already exists") from exc

    async def delete(self, permission_id: UUID) -> None:
        model = await self._session.get(PermissionModel, permission_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    async def find_by_id(self, permission_id: UUID) -> Permission | None:
        model = await self._session.get(PermissionModel, permission_id)
        return _to_entity(model) if model is not None else None

    async def find_by_code(self, code: str) -> Permission | None:
        result = await self._session.execute(select(PermissionModel).where(PermissionModel.code == code))
        model = result.scalar_one_or_none()
        return _to_entity(model) if model is not None else None

    async def find_by_ids(self, permission_ids: set[UUID]) -> list[Permission]:
        if not permission_ids:
            return []
        result = await self._session.execute(
            select(PermissionModel).where(PermissionModel.id.in_(permission_ids))
        )
        return [_to_entity(m) for m in result.scalars().all()]

    async def list_all(self, limit: int, offset: int) -> list[Permission]:
        result = await self._session.execute(
            select(PermissionModel).order_by(PermissionModel.code).limit(limit).offset(offset)
        )
        return [_to_entity(m) for m in result.scalars().all()]
