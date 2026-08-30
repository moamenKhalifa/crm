from __future__ import annotations

from uuid import UUID

from app.modules.identity_access.domain.errors import UserNotFoundError
from app.modules.identity_access.domain.ports.repositories import UserRepository


class DeleteUser:
    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, user_id: UUID) -> None:
        user = await self._user_repo.find_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {user_id}")
        await self._user_repo.delete(user_id)
