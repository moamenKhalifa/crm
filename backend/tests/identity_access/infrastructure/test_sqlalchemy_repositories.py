from uuid import uuid4

import pytest

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.entities.refresh_token import RefreshToken
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import DuplicateAccountError
from app.modules.identity_access.domain.ports.repositories import ListQuery
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_permission_repository import (
    SqlAlchemyPermissionRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_refresh_token_repository import (
    SqlAlchemyRefreshTokenRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_role_repository import (
    SqlAlchemyRoleRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)

from ..fakes import FrozenClock


async def test_user_crud_and_case_insensitive_unique_email(db_session_override):
    session_factory, _override = db_session_override
    clock = FrozenClock()

    async with session_factory() as session:
        repo = SqlAlchemyUserRepository(session)
        user = User(
            id=uuid4(),
            email="foo@example.com",
            hashed_password="h",
            full_name="Foo",
            is_active=True,
            is_customer=True,
            created_at=clock.now(),
            updated_at=clock.now(),
            role_ids=set(),
        )
        await repo.add(user)
        await session.commit()

    async with session_factory() as session:
        repo = SqlAlchemyUserRepository(session)
        found = await repo.find_by_email("FOO@EXAMPLE.COM")
        assert found is not None
        assert found.id == user.id

        dup = User(
            id=uuid4(),
            email="Foo@Example.com",
            hashed_password="h",
            full_name="Dup",
            is_active=True,
            is_customer=True,
            created_at=clock.now(),
            updated_at=clock.now(),
            role_ids=set(),
        )
        with pytest.raises(DuplicateAccountError):
            await repo.add(dup)


async def test_role_and_permission_crud(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        role_repo = SqlAlchemyRoleRepository(session)
        permission_repo = SqlAlchemyPermissionRepository(session)

        permission = Permission(id=uuid4(), code="User.View", description=None)
        await permission_repo.add(permission)

        role = Role(id=uuid4(), name="agent", description=None, permission_ids={permission.id})
        await role_repo.add(role)
        await session.commit()

    async with session_factory() as session:
        role_repo = SqlAlchemyRoleRepository(session)
        found = await role_repo.find_by_id(role.id)
        assert found is not None
        assert found.permission_ids == {permission.id}


async def test_refresh_token_find_and_revoke(db_session_override):
    session_factory, _override = db_session_override
    clock = FrozenClock()

    async with session_factory() as session:
        user_repo = SqlAlchemyUserRepository(session)
        user = User(
            id=uuid4(),
            email="rt@example.com",
            hashed_password="h",
            full_name="RT",
            is_active=True,
            is_customer=True,
            created_at=clock.now(),
            updated_at=clock.now(),
            role_ids=set(),
        )
        await user_repo.add(user)

        refresh_repo = SqlAlchemyRefreshTokenRepository(session)
        token = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_hash="hash-abc",
            issued_at=clock.now(),
            expires_at=clock.now(),
            revoked_at=None,
        )
        await refresh_repo.add(token)
        await session.commit()

    async with session_factory() as session:
        refresh_repo = SqlAlchemyRefreshTokenRepository(session)
        found = await refresh_repo.find_by_hash("hash-abc")
        assert found is not None
        assert found.revoked_at is None

        await refresh_repo.revoke(found.id, clock.now())
        await session.commit()

    async with session_factory() as session:
        refresh_repo = SqlAlchemyRefreshTokenRepository(session)
        found = await refresh_repo.find_by_hash("hash-abc")
        assert found.revoked_at is not None


async def test_user_delete_cascades_refresh_tokens(db_session_override):
    session_factory, _override = db_session_override
    clock = FrozenClock()

    async with session_factory() as session:
        user_repo = SqlAlchemyUserRepository(session)
        user = User(
            id=uuid4(),
            email="cascade@example.com",
            hashed_password="h",
            full_name="C",
            is_active=True,
            is_customer=True,
            created_at=clock.now(),
            updated_at=clock.now(),
            role_ids=set(),
        )
        await user_repo.add(user)

        refresh_repo = SqlAlchemyRefreshTokenRepository(session)
        token = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_hash="hash-cascade",
            issued_at=clock.now(),
            expires_at=clock.now(),
            revoked_at=None,
        )
        await refresh_repo.add(token)
        await session.commit()

        await user_repo.delete(user.id)
        await session.commit()

    async with session_factory() as session:
        refresh_repo = SqlAlchemyRefreshTokenRepository(session)
        found = await refresh_repo.find_by_hash("hash-cascade")
        assert found is None


async def test_user_list_paged_counts_match_filtered_ilike(db_session_override):
    session_factory, _override = db_session_override
    clock = FrozenClock()

    async with session_factory() as session:
        repo = SqlAlchemyUserRepository(session)
        for name, email in (
            ("Jane Doe", "jane.doe@example.com"),
            ("John Smith", "john.smith@example.com"),
            ("Janet Lane", "janet.lane@example.com"),
        ):
            await repo.add(
                User(
                    id=uuid4(),
                    email=email,
                    hashed_password="h",
                    full_name=name,
                    is_active=True,
                    is_customer=True,
                    created_at=clock.now(),
                    updated_at=clock.now(),
                    role_ids=set(),
                )
            )
        await session.commit()

    async with session_factory() as session:
        repo = SqlAlchemyUserRepository(session)
        items, total = await repo.list_paged(ListQuery(limit=10, offset=0, q="jan"))
        assert total == 2
        assert {u.full_name for u in items} == {"Jane Doe", "Janet Lane"}

        page, page_total = await repo.list_paged(ListQuery(limit=1, offset=0, q="jan"))
        assert page_total == 2
        assert len(page) == 1


async def test_user_list_paged_sort_whitelist_enforced(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        repo = SqlAlchemyUserRepository(session)
        with pytest.raises(ValueError):
            await repo.list_paged(ListQuery(sort_by="hashed_password"))


async def test_role_list_paged_counts_match_filtered_ilike(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        role_repo = SqlAlchemyRoleRepository(session)
        await role_repo.add(Role(id=uuid4(), name="billing-team", description=None, permission_ids=set()))
        await role_repo.add(Role(id=uuid4(), name="support-team", description=None, permission_ids=set()))
        await role_repo.add(Role(id=uuid4(), name="billing-admin", description=None, permission_ids=set()))
        await session.commit()

    async with session_factory() as session:
        role_repo = SqlAlchemyRoleRepository(session)
        items, total = await role_repo.list_paged(ListQuery(limit=10, offset=0, q="billing"))
        assert total == 2
        assert {r.name for r in items} == {"billing-team", "billing-admin"}


async def test_role_list_paged_sort_whitelist_enforced(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        role_repo = SqlAlchemyRoleRepository(session)
        with pytest.raises(ValueError):
            await role_repo.list_paged(ListQuery(sort_by="created_at"))


async def test_permission_list_paged_counts_match_filtered_ilike(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        permission_repo = SqlAlchemyPermissionRepository(session)
        await permission_repo.add(Permission(id=uuid4(), code="Billing.View", description=None))
        await permission_repo.add(Permission(id=uuid4(), code="Support.View", description=None))
        await permission_repo.add(Permission(id=uuid4(), code="Billing.Create", description=None))
        await session.commit()

    async with session_factory() as session:
        permission_repo = SqlAlchemyPermissionRepository(session)
        items, total = await permission_repo.list_paged(ListQuery(limit=10, offset=0, q="billing"))
        assert total == 2
        assert {p.code for p in items} == {"Billing.View", "Billing.Create"}


async def test_permission_list_paged_sort_whitelist_enforced(db_session_override):
    session_factory, _override = db_session_override

    async with session_factory() as session:
        permission_repo = SqlAlchemyPermissionRepository(session)
        with pytest.raises(ValueError):
            await permission_repo.list_paged(ListQuery(sort_by="description"))
