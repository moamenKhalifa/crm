from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.ports.repositories import PermissionRepository, RoleRepository


async def resolve_effective_permissions_for_roles(
    roles: list[Role], permission_repo: PermissionRepository
) -> set[str]:
    permission_ids: set[UUID] = set()
    for role in roles:
        permission_ids |= role.permission_ids
    if not permission_ids:
        return set()

    permissions = await permission_repo.find_by_ids(permission_ids)
    return {permission.code for permission in permissions}


async def resolve_effective_permissions(
    user: User, role_repo: RoleRepository, permission_repo: PermissionRepository
) -> set[str]:
    """Live (uncached) resolution — always reflects the current role/permission
    relationships in the database, not whatever was embedded in the caller's JWT.
    """
    if not user.role_ids:
        return set()

    roles = await role_repo.find_by_ids(user.role_ids)
    return await resolve_effective_permissions_for_roles(roles, permission_repo)
