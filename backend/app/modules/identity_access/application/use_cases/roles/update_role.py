from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import DuplicateRoleError, RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


@dataclass(frozen=True)
class UpdateRoleCommand:
    role_id: UUID
    name: str | None = None
    description: str | None = None


class UpdateRole:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, command: UpdateRoleCommand) -> RoleSummary:
        role = await self._role_repo.find_by_id(command.role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {command.role_id}")

        if command.name is not None and command.name != role.name:
            existing = await self._role_repo.find_by_name(command.name)
            if existing is not None and existing.id != role.id:
                raise DuplicateRoleError(f"A role named {command.name!r} already exists")
            role.name = command.name

        if command.description is not None:
            role.description = command.description

        await self._role_repo.update(role)
        return to_role_summary(role)
