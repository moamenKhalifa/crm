from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import PermissionNotFoundError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository

from ...dto import PermissionSummary
from ...mappers import to_permission_summary


class GetPermission:
    def __init__(self, permission_repo: PermissionRepository) -> None:
        self._permission_repo = permission_repo

    async def execute(self, permission_id: UUID) -> PermissionSummary:
        permission = await self._permission_repo.find_by_id(permission_id)
        if permission is None:
            raise PermissionNotFoundError(f"No permission with id {permission_id}")
        return to_permission_summary(permission)
