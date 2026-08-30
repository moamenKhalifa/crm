from __future__ import annotations

from app.modules.identity_access.domain.ports.repositories import RoleRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


class ListRoles:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, limit: int = 50, offset: int = 0) -> list[RoleSummary]:
        roles = await self._role_repo.list_all(limit, offset)
        return [to_role_summary(role) for role in roles]
