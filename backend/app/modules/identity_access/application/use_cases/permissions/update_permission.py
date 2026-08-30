from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import DuplicatePermissionError, PermissionNotFoundError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository

from ...dto import PermissionSummary
from ...mappers import to_permission_summary


@dataclass(frozen=True)
class UpdatePermissionCommand:
    permission_id: UUID
    code: str | None = None
    description: str | None = None


class UpdatePermission:
    def __init__(self, permission_repo: PermissionRepository) -> None:
        self._permission_repo = permission_repo

    async def execute(self, command: UpdatePermissionCommand) -> PermissionSummary:
        permission = await self._permission_repo.find_by_id(command.permission_id)
        if permission is None:
            raise PermissionNotFoundError(f"No permission with id {command.permission_id}")

        if command.code is not None and command.code != permission.code:
            existing = await self._permission_repo.find_by_code(command.code)
            if existing is not None and existing.id != permission.id:
                raise DuplicatePermissionError(f"A permission coded {command.code!r} already exists")
            permission.code = command.code

        if command.description is not None:
            permission.description = command.description

        await self._permission_repo.update(permission)
        return to_permission_summary(permission)
