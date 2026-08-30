from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import UserNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository

from ...dto import RoleSummary
from ...mappers import to_role_summary


class GetUserRoles:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo

    async def execute(self, user_id: UUID) -> list[RoleSummary]:
        user = await self._user_repo.find_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {user_id}")
        if not user.role_ids:
            return []
        roles = await self._role_repo.find_by_ids(user.role_ids)
        return [to_role_summary(role) for role in roles]
