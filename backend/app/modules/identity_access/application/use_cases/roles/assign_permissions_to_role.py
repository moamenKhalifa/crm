from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import PermissionNotFoundError, RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import PermissionRepository, RoleRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


@dataclass(frozen=True)
class AssignPermissionsToRoleCommand:
    role_id: UUID
    permission_ids: frozenset[UUID]


class AssignPermissionsToRole:
    """Adds the given permission ids to the role's existing set (union)."""

    def __init__(self, role_repo: RoleRepository, permission_repo: PermissionRepository) -> None:
        self._role_repo = role_repo
        self._permission_repo = permission_repo

    async def execute(self, command: AssignPermissionsToRoleCommand) -> RoleSummary:
        role = await self._role_repo.find_by_id(command.role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {command.role_id}")

        if command.permission_ids:
            permissions = await self._permission_repo.find_by_ids(set(command.permission_ids))
            missing = set(command.permission_ids) - {permission.id for permission in permissions}
            if missing:
                raise PermissionNotFoundError(f"Unknown permission id(s): {sorted(str(i) for i in missing)}")
            role.permission_ids |= set(command.permission_ids)
            await self._role_repo.update(role)

        return to_role_summary(role)
