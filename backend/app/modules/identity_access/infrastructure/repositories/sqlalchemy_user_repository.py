from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import DuplicateAccountError
from app.modules.identity_access.domain.ports.repositories import ListQuery
from app.modules.identity_access.infrastructure.orm.models import UserModel, UserRoleModel
from app.modules.identity_access.infrastructure.time_utils import ensure_utc

# Whitelisted sort columns for `list_paged`; anything outside this set is
# rejected with `ValueError` (mapped to HTTP 400 by the router layer).
_SORT_COLUMNS: dict[str, Any] = {
    "full_name": UserModel.full_name,
    "email": UserModel.email,
    "created_at": UserModel.created_at,
    "is_active": UserModel.is_active,
}


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

    async def list_paged(self, query: ListQuery) -> tuple[list[User], int]:
        sort_column = _SORT_COLUMNS["created_at"]
        if query.sort_by is not None:
            column = _SORT_COLUMNS.get(query.sort_by)
            if column is None:
                raise ValueError(f"Unknown sort column: {query.sort_by}")
            sort_column = column

        stmt = select(UserModel)
        joined_roles = False

        if query.q and len(query.q.strip()) >= 2:
            pattern = f"%{query.q.strip()}%"
            stmt = stmt.where(or_(UserModel.full_name.ilike(pattern), UserModel.email.ilike(pattern)))

        is_active_filter = query.filters.get("is_active")
        if is_active_filter:
            stmt = stmt.where(UserModel.is_active == (is_active_filter[0] == "true"))

        role_id_filter = query.filters.get("role_id")
        if role_id_filter:
            stmt = stmt.join(UserRoleModel, UserRoleModel.user_id == UserModel.id).where(
                UserRoleModel.role_id.in_(UUID(r) for r in role_id_filter)
            )
            joined_roles = True

        if joined_roles:
            stmt = stmt.distinct()

        total = (
            await self._session.execute(select(func.count()).select_from(stmt.subquery()))
        ).scalar_one()

        order_col = sort_column.desc() if query.sort_dir == "desc" else sort_column.asc()
        stmt = stmt.order_by(order_col).limit(query.limit).offset(query.offset)
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [_to_entity(m, await self._role_ids_for(m.id)) for m in models], total
