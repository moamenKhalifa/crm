from __future__ import annotations

from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository

from ...dto import ListQuery, PagedResult, UserSummary
from ...mappers import to_user_summary


class ListUsers:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo

    async def execute(self, limit: int = 50, offset: int = 0) -> list[UserSummary]:
        users = await self._user_repo.list_all(limit, offset)
        return [await to_user_summary(user, self._role_repo) for user in users]

    async def execute_paged(self, query: ListQuery) -> PagedResult[UserSummary]:
        users, total = await self._user_repo.list_paged(query)
        items = [await to_user_summary(user, self._role_repo) for user in users]
        return PagedResult(items=items, total=total)
