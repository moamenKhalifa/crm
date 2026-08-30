from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository, RoleRepository

from ...dto import PermissionSummary
from ...mappers import to_permission_summary


class GetRolePermissions:
    def __init__(self, role_repo: RoleRepository, permission_repo: PermissionRepository) -> None:
        self._role_repo = role_repo
        self._permission_repo = permission_repo

    async def execute(self, role_id: UUID) -> list[PermissionSummary]:
        role = await self._role_repo.find_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {role_id}")
        if not role.permission_ids:
            return []
        permissions = await self._permission_repo.find_by_ids(role.permission_ids)
        return [to_permission_summary(permission) for permission in permissions]
