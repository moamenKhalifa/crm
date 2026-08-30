from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import UserNotFoundError
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository

from ...dto import UserSummary
from ...mappers import to_user_summary


class GetUser:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo

    async def execute(self, user_id: UUID) -> UserSummary:
        user = await self._user_repo.find_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {user_id}")
        return await to_user_summary(user, self._role_repo)
