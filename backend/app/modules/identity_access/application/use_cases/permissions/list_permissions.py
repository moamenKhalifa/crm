from __future__ import annotations

from app.modules.identity_access.domain.ports.repositories import PermissionRepository

from ...dto import PermissionSummary
from ...mappers import to_permission_summary


class ListPermissions:
    def __init__(self, permission_repo: PermissionRepository) -> None:
        self._permission_repo = permission_repo

    async def execute(self, limit: int = 50, offset: int = 0) -> list[PermissionSummary]:
        permissions = await self._permission_repo.list_all(limit, offset)
        return [to_permission_summary(permission) for permission in permissions]
