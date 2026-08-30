from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import RoleNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


class GetRole:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, role_id: UUID) -> RoleSummary:
        role = await self._role_repo.find_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(f"No role with id {role_id}")
        return to_role_summary(role)
