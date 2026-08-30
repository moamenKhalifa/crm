from uuid import uuid4

import pytest

from app.modules.identity_access.application.use_cases.roles.assign_permissions_to_role import (
    AssignPermissionsToRole,
    AssignPermissionsToRoleCommand,
)
from app.modules.identity_access.application.use_cases.roles.create_role import CreateRole, CreateRoleCommand
from app.modules.identity_access.application.use_cases.roles.delete_role import DeleteRole
from app.modules.identity_access.application.use_cases.roles.get_role import GetRole
from app.modules.identity_access.application.use_cases.roles.get_role_permissions import GetRolePermissions
from app.modules.identity_access.application.use_cases.roles.list_roles import ListRoles
from app.modules.identity_access.application.use_cases.roles.remove_permissions_from_role import (
    RemovePermissionsFromRole,
    RemovePermissionsFromRoleCommand,
)
from app.modules.identity_access.application.use_cases.roles.update_role import UpdateRole, UpdateRoleCommand
from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.errors import (
    DuplicateRoleError,
    PermissionNotFoundError,
    RoleNotFoundError,
)

from ..fakes import FakePermissionRepository, FakeRoleRepository


async def test_create_role_success():
    role_repo = FakeRoleRepository()
    result = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent", description="Agent role"))
    assert result.name == "agent"


async def test_create_role_duplicate_name_rejected():
    role_repo = FakeRoleRepository()
    await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    with pytest.raises(DuplicateRoleError):
        await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))


async def test_list_roles_returns_created():
    role_repo = FakeRoleRepository()
    await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    results = await ListRoles(role_repo).execute()
    assert len(results) == 1


async def test_get_role_not_found_raises():
    with pytest.raises(RoleNotFoundError):
        await GetRole(FakeRoleRepository()).execute(uuid4())


async def test_update_role_renames():
    role_repo = FakeRoleRepository()
    created = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    updated = await UpdateRole(role_repo).execute(UpdateRoleCommand(role_id=created.id, name="senior-agent"))
    assert updated.name == "senior-agent"


async def test_update_role_duplicate_name_rejected():
    role_repo = FakeRoleRepository()
    await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    other = await CreateRole(role_repo).execute(CreateRoleCommand(name="admin"))
    with pytest.raises(DuplicateRoleError):
        await UpdateRole(role_repo).execute(UpdateRoleCommand(role_id=other.id, name="agent"))


async def test_delete_role_removes_it():
    role_repo = FakeRoleRepository()
    created = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    await DeleteRole(role_repo).execute(created.id)
    with pytest.raises(RoleNotFoundError):
        await GetRole(role_repo).execute(created.id)


async def test_assign_permissions_to_role_adds_permissions():
    role_repo, permission_repo = FakeRoleRepository(), FakePermissionRepository()
    role = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    permission = Permission(id=uuid4(), code="User.View", description=None)
    await permission_repo.add(permission)

    updated = await AssignPermissionsToRole(role_repo, permission_repo).execute(
        AssignPermissionsToRoleCommand(role_id=role.id, permission_ids=frozenset({permission.id}))
    )
    assert updated.id == role.id
    perms = await GetRolePermissions(role_repo, permission_repo).execute(role.id)
    assert [p.code for p in perms] == ["User.View"]


async def test_assign_permissions_unknown_permission_rejected():
    role_repo, permission_repo = FakeRoleRepository(), FakePermissionRepository()
    role = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    with pytest.raises(PermissionNotFoundError):
        await AssignPermissionsToRole(role_repo, permission_repo).execute(
            AssignPermissionsToRoleCommand(role_id=role.id, permission_ids=frozenset({uuid4()}))
        )


async def test_remove_permissions_from_role():
    role_repo, permission_repo = FakeRoleRepository(), FakePermissionRepository()
    role = await CreateRole(role_repo).execute(CreateRoleCommand(name="agent"))
    permission = Permission(id=uuid4(), code="User.View", description=None)
    await permission_repo.add(permission)
    await AssignPermissionsToRole(role_repo, permission_repo).execute(
        AssignPermissionsToRoleCommand(role_id=role.id, permission_ids=frozenset({permission.id}))
    )

    await RemovePermissionsFromRole(role_repo).execute(
        RemovePermissionsFromRoleCommand(role_id=role.id, permission_ids=frozenset({permission.id}))
    )
    perms = await GetRolePermissions(role_repo, permission_repo).execute(role.id)
    assert perms == []
