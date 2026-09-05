from __future__ import annotations

from app.modules.identity_access.domain.ports.repositories import RoleRepository

from ...dto import ListQuery, PagedResult, RoleSummary
from ...mappers import to_role_summary


class ListRoles:
    def __init__(self, role_repo: RoleRepository) -> None:
        self._role_repo = role_repo

    async def execute(self, limit: int = 50, offset: int = 0) -> list[RoleSummary]:
        roles = await self._role_repo.list_all(limit, offset)
        return [to_role_summary(role) for role in roles]

    async def execute_paged(self, query: ListQuery) -> PagedResult[RoleSummary]:
        roles, total = await self._role_repo.list_paged(query)
        items = [to_role_summary(role) for role in roles]
        return PagedResult(items=items, total=total)
