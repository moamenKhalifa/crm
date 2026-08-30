from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import UserNotFoundError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository

from ...dto import UserSummary
from ...mappers import to_user_summary


@dataclass(frozen=True)
class SetUserActiveCommand:
    user_id: UUID
    is_active: bool


class SetUserActive:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository, clock: Clock) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._clock = clock

    async def execute(self, command: SetUserActiveCommand) -> UserSummary:
        user = await self._user_repo.find_by_id(command.user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {command.user_id}")

        user.is_active = command.is_active
        user.updated_at = self._clock.now()
        await self._user_repo.update(user)

        return await to_user_summary(user, self._role_repo)
