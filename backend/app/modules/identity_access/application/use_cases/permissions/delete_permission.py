from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import PermissionNotFoundError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository


class DeletePermission:
    def __init__(self, permission_repo: PermissionRepository) -> None:
        self._permission_repo = permission_repo

    async def execute(self, permission_id: UUID) -> None:
        permission = await self._permission_repo.find_by_id(permission_id)
        if permission is None:
            raise PermissionNotFoundError(f"No permission with id {permission_id}")
        await self._permission_repo.delete(permission_id)
