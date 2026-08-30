from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import RoleNotFoundError, UserNotFoundError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository

from ...dto import UserSummary
from ...mappers import to_user_summary


@dataclass(frozen=True)
class AssignRolesToUserCommand:
    user_id: UUID
    role_ids: frozenset[UUID]


class AssignRolesToUser:
    """Replaces a user's full role assignment with the given set of role ids."""

    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository, clock: Clock) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._clock = clock

    async def execute(self, command: AssignRolesToUserCommand) -> UserSummary:
        user = await self._user_repo.find_by_id(command.user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {command.user_id}")

        roles = []
        if command.role_ids:
            roles = await self._role_repo.find_by_ids(set(command.role_ids))
            missing = set(command.role_ids) - {role.id for role in roles}
            if missing:
                raise RoleNotFoundError(f"Unknown role id(s): {sorted(str(i) for i in missing)}")

        user.role_ids = {role.id for role in roles}
        user.updated_at = self._clock.now()
        await self._user_repo.update(user)

        return await to_user_summary(user, self._role_repo)
