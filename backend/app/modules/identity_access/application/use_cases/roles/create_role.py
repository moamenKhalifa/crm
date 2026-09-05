from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.errors import DuplicateRoleError
from app.modules.identity_access.domain.ports.repositories import RoleRepository
from app.modules.identity_access.domain.value_objects.role_name import RoleName

from ...dto import RoleSummary
from ...mappers import to_role_summary


@dataclass(frozen=True)
class CreateRoleCommand:
    name: str
    description: str | None = None


class CreateRole:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, command: CreateRoleCommand) -> RoleSummary:
        name = RoleName(command.name).value
        if await self._role_repo.find_by_name(name) is not None:
            raise DuplicateRoleError(f"A role named {name!r} already exists")

        role = Role(id=uuid4(), name=name, description=command.description, permission_ids=set())
        await self._role_repo.add(role)
        return to_role_summary(role)
