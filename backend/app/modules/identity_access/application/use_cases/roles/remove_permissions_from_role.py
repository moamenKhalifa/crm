from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


@dataclass(frozen=True)
class RemovePermissionsFromRoleCommand:
    role_id: UUID
    permission_ids: frozenset[UUID]


class RemovePermissionsFromRole:
    """Removes the given permission ids from the role's set. Idempotent —
    removing an id the role never had is a no-op, not an error."""

    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, command: RemovePermissionsFromRoleCommand) -> RoleSummary:
        role = await self._role_repo.find_by_id(command.role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {command.role_id}")

        if command.permission_ids:
            role.permission_ids -= set(command.permission_ids)
            await self._role_repo.update(role)

        return to_role_summary(role)
