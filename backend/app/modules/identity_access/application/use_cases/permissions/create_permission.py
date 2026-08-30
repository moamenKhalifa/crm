from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.errors import DuplicatePermissionError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository

from ...dto import PermissionSummary
from ...mappers import to_permission_summary


@dataclass(frozen=True)
class CreatePermissionCommand:
    code: str
    description: str | None = None


class CreatePermission:
    def __init__(self, permission_repo: PermissionRepository) -> None:
        self._permission_repo = permission_repo

    async def execute(self, command: CreatePermissionCommand) -> PermissionSummary:
        if await self._permission_repo.find_by_code(command.code) is not None:
            raise DuplicatePermissionError(f"A permission coded {command.code!r} already exists")

        permission = Permission(id=uuid4(), code=command.code, description=command.description)
        await self._permission_repo.add(permission)
        return to_permission_summary(permission)
