from uuid import uuid4

import pytest

from app.modules.identity_access.application.use_cases.permissions.create_permission import (
    CreatePermission,
    CreatePermissionCommand,
)
from app.modules.identity_access.application.use_cases.permissions.delete_permission import DeletePermission
from app.modules.identity_access.application.use_cases.permissions.get_permission import GetPermission
from app.modules.identity_access.application.use_cases.permissions.list_permissions import ListPermissions
from app.modules.identity_access.application.use_cases.permissions.update_permission import (
    UpdatePermission,
    UpdatePermissionCommand,
)
from app.modules.identity_access.domain.errors import DuplicatePermissionError, PermissionNotFoundError
from app.modules.identity_access.domain.ports.repositories import ListQuery

from ..fakes import FakePermissionRepository


async def test_create_permission_success():
    repo = FakePermissionRepository()
    result = await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))
    assert result.code == "User.View"


async def test_create_permission_duplicate_code_rejected():
    repo = FakePermissionRepository()
    await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))
    with pytest.raises(DuplicatePermissionError):
        await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))


async def test_list_permissions_returns_created():
    repo = FakePermissionRepository()
    await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))
    results = await ListPermissions(repo).execute()
    assert len(results) == 1


async def test_list_permissions_execute_paged_returns_total():
    repo = FakePermissionRepository()
    for code in ("User.View", "User.Create", "User.Update"):
        await CreatePermission(repo).execute(CreatePermissionCommand(code=code))

    result = await ListPermissions(repo).execute_paged(ListQuery(limit=2, offset=0))

    assert result.total == 3
    assert len(result.items) == 2


async def test_get_permission_not_found_raises():
    with pytest.raises(PermissionNotFoundError):
        await GetPermission(FakePermissionRepository()).execute(uuid4())


async def test_update_permission_changes_code():
    repo = FakePermissionRepository()
    created = await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))
    updated = await UpdatePermission(repo).execute(
        UpdatePermissionCommand(permission_id=created.id, code="User.List")
    )
    assert updated.code == "User.List"


async def test_delete_permission_removes_it():
    repo = FakePermissionRepository()
    created = await CreatePermission(repo).execute(CreatePermissionCommand(code="User.View"))
    await DeletePermission(repo).execute(created.id)
    with pytest.raises(PermissionNotFoundError):
        await GetPermission(repo).execute(created.id)
