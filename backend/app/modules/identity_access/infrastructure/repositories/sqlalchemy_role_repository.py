from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.errors import DuplicateRoleError
from app.modules.identity_access.infrastructure.orm.models import RoleModel, RolePermissionModel


def _to_entity(model: RoleModel, permission_ids: set[UUID]) -> Role:
    return Role(id=model.id, name=model.name, description=model.description, permission_ids=permission_ids)


class SqlAlchemyRoleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _permission_ids_for(self, role_id: UUID) -> set[UUID]:
        result = await self._session.execute(
            select(RolePermissionModel.permission_id).where(RolePermissionModel.role_id == role_id)
        )
        return set(result.scalars().all())

    async def add(self, role: Role) -> None:
        model = RoleModel(id=role.id, name=role.name, description=role.description)
        self._session.add(model)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicateRoleError(f"A role named {role.name!r} already exists") from exc

        for permission_id in role.permission_ids:
            self._session.add(RolePermissionModel(role_id=role.id, permission_id=permission_id))
        await self._session.flush()

    async def update(self, role: Role) -> None:
        model = await self._session.get(RoleModel, role.id)
        if model is None:
            return
        model.name = role.name
        model.description = role.description
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicateRoleError(f"A role named {role.name!r} already exists") from exc

        await self._session.execute(delete(RolePermissionModel).where(RolePermissionModel.role_id == role.id))
        for permission_id in role.permission_ids:
            self._session.add(RolePermissionModel(role_id=role.id, permission_id=permission_id))
        await self._session.flush()

    async def delete(self, role_id: UUID) -> None:
        model = await self._session.get(RoleModel, role_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    async def find_by_id(self, role_id: UUID) -> Role | None:
        model = await self._session.get(RoleModel, role_id)
        if model is None:
            return None
        return _to_entity(model, await self._permission_ids_for(role_id))

    async def find_by_name(self, name: str) -> Role | None:
        result = await self._session.execute(select(RoleModel).where(RoleModel.name == name))
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return _to_entity(model, await self._permission_ids_for(model.id))

    async def find_by_ids(self, role_ids: set[UUID]) -> list[Role]:
        if not role_ids:
            return []
        result = await self._session.execute(select(RoleModel).where(RoleModel.id.in_(role_ids)))
        models = result.scalars().all()
        return [_to_entity(m, await self._permission_ids_for(m.id)) for m in models]

    async def list_all(self, limit: int, offset: int) -> list[Role]:
        result = await self._session.execute(
            select(RoleModel).order_by(RoleModel.name).limit(limit).offset(offset)
        )
        models = result.scalars().all()
        return [_to_entity(m, await self._permission_ids_for(m.id)) for m in models]
