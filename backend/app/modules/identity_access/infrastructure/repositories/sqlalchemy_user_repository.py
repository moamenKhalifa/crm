from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import DuplicateAccountError
from app.modules.identity_access.infrastructure.orm.models import UserModel, UserRoleModel
from app.modules.identity_access.infrastructure.time_utils import ensure_utc


def _to_entity(model: UserModel, role_ids: set[UUID]) -> User:
    return User(
        id=model.id,
        email=model.email,
        hashed_password=model.hashed_password,
        full_name=model.full_name,
        is_active=model.is_active,
        is_customer=model.is_customer,
        created_at=ensure_utc(model.created_at),
        updated_at=ensure_utc(model.updated_at),
        role_ids=role_ids,
    )


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _role_ids_for(self, user_id: UUID) -> set[UUID]:
        result = await self._session.execute(
            select(UserRoleModel.role_id).where(UserRoleModel.user_id == user_id)
        )
        return set(result.scalars().all())

    async def add(self, user: User) -> None:
        model = UserModel(
            id=user.id,
            email=user.email,
            hashed_password=user.hashed_password,
            full_name=user.full_name,
            is_active=user.is_active,
            is_customer=user.is_customer,
        )
        self._session.add(model)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicateAccountError(f"An account with email {user.email} already exists") from exc

        for role_id in user.role_ids:
            self._session.add(UserRoleModel(user_id=user.id, role_id=role_id))
        await self._session.flush()

    async def update(self, user: User) -> None:
        model = await self._session.get(UserModel, user.id)
        if model is None:
            return
        model.email = user.email
        model.hashed_password = user.hashed_password
        model.full_name = user.full_name
        model.is_active = user.is_active
        model.is_customer = user.is_customer

        try:
            await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise DuplicateAccountError(f"An account with email {user.email} already exists") from exc

        await self._session.execute(delete(UserRoleModel).where(UserRoleModel.user_id == user.id))
        for role_id in user.role_ids:
            self._session.add(UserRoleModel(user_id=user.id, role_id=role_id))
        await self._session.flush()

    async def delete(self, user_id: UUID) -> None:
        model = await self._session.get(UserModel, user_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    async def find_by_id(self, user_id: UUID) -> User | None:
        model = await self._session.get(UserModel, user_id)
        if model is None:
            return None
        return _to_entity(model, await self._role_ids_for(user_id))

    async def find_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(func.lower(UserModel.email) == email.strip().lower())
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return _to_entity(model, await self._role_ids_for(model.id))

    async def find_by_ids(self, user_ids: set[UUID]) -> list[User]:
        if not user_ids:
            return []
        result = await self._session.execute(select(UserModel).where(UserModel.id.in_(user_ids)))
        models = result.scalars().all()
        return [_to_entity(m, await self._role_ids_for(m.id)) for m in models]

    async def list_all(self, limit: int, offset: int) -> list[User]:
        result = await self._session.execute(
            select(UserModel).order_by(UserModel.created_at).limit(limit).offset(offset)
        )
        models = result.scalars().all()
        return [_to_entity(m, await self._role_ids_for(m.id)) for m in models]
