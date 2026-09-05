from uuid import uuid4

import pytest

from app.modules.identity_access.application.use_cases.users.assign_roles_to_user import (
    AssignRolesToUser,
    AssignRolesToUserCommand,
)
from app.modules.identity_access.application.use_cases.users.create_user import CreateUser, CreateUserCommand
from app.modules.identity_access.application.use_cases.users.delete_user import DeleteUser
from app.modules.identity_access.application.use_cases.users.get_user import GetUser
from app.modules.identity_access.application.use_cases.users.get_user_roles import GetUserRoles
from app.modules.identity_access.application.use_cases.users.list_users import ListUsers
from app.modules.identity_access.application.use_cases.users.set_user_active import (
    SetUserActive,
    SetUserActiveCommand,
)
from app.modules.identity_access.application.use_cases.users.update_user import UpdateUser, UpdateUserCommand
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.errors import DuplicateAccountError, RoleNotFoundError, UserNotFoundError
from app.modules.identity_access.domain.ports.repositories import ListQuery

from ..fakes import FakePasswordHasher, FakeRoleRepository, FakeUserRepository, FrozenClock


def _repos():
    return FakeUserRepository(), FakeRoleRepository(), FakePasswordHasher(), FrozenClock()


async def test_create_user_success():
    user_repo, role_repo, hasher, clock = _repos()
    result = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="staff@example.com", password="Passw0rd!", full_name="Staff Person")
    )
    assert result.email == "staff@example.com"
    assert result.is_customer is False


async def test_create_user_duplicate_email_rejected():
    user_repo, role_repo, hasher, clock = _repos()
    use_case = CreateUser(user_repo, role_repo, hasher, clock)
    await use_case.execute(CreateUserCommand(email="dup@example.com", password="Passw0rd!", full_name="A"))

    with pytest.raises(DuplicateAccountError):
        await use_case.execute(CreateUserCommand(email="dup@example.com", password="Passw0rd!", full_name="B"))


async def test_create_user_unknown_role_rejected():
    user_repo, role_repo, hasher, clock = _repos()
    with pytest.raises(RoleNotFoundError):
        await CreateUser(user_repo, role_repo, hasher, clock).execute(
            CreateUserCommand(
                email="x@example.com", password="Passw0rd!", full_name="X", role_ids=frozenset({uuid4()})
            )
        )


async def test_get_user_not_found_raises():
    user_repo, role_repo, _hasher, _clock = _repos()
    with pytest.raises(UserNotFoundError):
        await GetUser(user_repo, role_repo).execute(uuid4())


async def test_list_users_returns_created_users():
    user_repo, role_repo, hasher, clock = _repos()
    await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    results = await ListUsers(user_repo, role_repo).execute()
    assert len(results) == 1


async def test_update_user_changes_full_name_and_email():
    user_repo, role_repo, hasher, clock = _repos()
    created = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    updated = await UpdateUser(user_repo, role_repo, clock).execute(
        UpdateUserCommand(user_id=created.id, full_name="A Updated", email="a2@example.com")
    )
    assert updated.full_name == "A Updated"
    assert updated.email == "a2@example.com"


async def test_set_user_active_toggles_flag():
    user_repo, role_repo, hasher, clock = _repos()
    created = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    updated = await SetUserActive(user_repo, role_repo, clock).execute(
        SetUserActiveCommand(user_id=created.id, is_active=False)
    )
    assert updated.is_active is False


async def test_delete_user_removes_it():
    user_repo, role_repo, hasher, clock = _repos()
    created = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    await DeleteUser(user_repo).execute(created.id)

    with pytest.raises(UserNotFoundError):
        await GetUser(user_repo, role_repo).execute(created.id)


async def test_delete_user_not_found_raises():
    user_repo, _role_repo, _hasher, _clock = _repos()
    with pytest.raises(UserNotFoundError):
        await DeleteUser(user_repo).execute(uuid4())


async def test_assign_roles_to_user_replaces_role_set():
    user_repo, role_repo, hasher, clock = _repos()
    created = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    role = Role(id=uuid4(), name="agent", description=None, permission_ids=set())
    await role_repo.add(role)

    updated = await AssignRolesToUser(user_repo, role_repo, clock).execute(
        AssignRolesToUserCommand(user_id=created.id, role_ids=frozenset({role.id}))
    )
    assert [r.id for r in updated.roles] == [role.id]


async def test_list_users_execute_paged_returns_total():
    user_repo, role_repo, hasher, clock = _repos()
    for i in range(3):
        await CreateUser(user_repo, role_repo, hasher, clock).execute(
            CreateUserCommand(email=f"user{i}@example.com", password="Passw0rd!", full_name=f"User {i}")
        )

    result = await ListUsers(user_repo, role_repo).execute_paged(ListQuery(limit=2, offset=0))

    assert result.total == 3
    assert len(result.items) == 2


async def test_get_user_roles_returns_assigned_roles():
    user_repo, role_repo, hasher, clock = _repos()
    created = await CreateUser(user_repo, role_repo, hasher, clock).execute(
        CreateUserCommand(email="a@example.com", password="Passw0rd!", full_name="A")
    )
    role = Role(id=uuid4(), name="agent", description=None, permission_ids=set())
    await role_repo.add(role)
    await AssignRolesToUser(user_repo, role_repo, clock).execute(
        AssignRolesToUserCommand(user_id=created.id, role_ids=frozenset({role.id}))
    )

    roles = await GetUserRoles(user_repo, role_repo).execute(created.id)
    assert [r.id for r in roles] == [role.id]
