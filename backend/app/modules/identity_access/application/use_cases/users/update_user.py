from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.modules.identity_access.domain.errors import DuplicateAccountError, UserNotFoundError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository
from app.modules.identity_access.domain.value_objects.email import Email

from ...dto import UserSummary
from ...mappers import to_user_summary


@dataclass(frozen=True)
class UpdateUserCommand:
    user_id: UUID
    full_name: str | None = None
    email: str | None = None


class UpdateUser:
    def __init__(self, user_repo: UserRepository, role_repo: RoleRepository, clock: Clock) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._clock = clock

    async def execute(self, command: UpdateUserCommand) -> UserSummary:
        user = await self._user_repo.find_by_id(command.user_id)
        if user is None:
            raise UserNotFoundError(f"No user with id {command.user_id}")

        if command.email is not None:
            new_email = Email(command.email)
            if str(new_email) != user.email:
                existing = await self._user_repo.find_by_email(str(new_email))
                if existing is not None and existing.id != user.id:
                    raise DuplicateAccountError(f"An account with email {new_email} already exists")
                user.email = str(new_email)

        if command.full_name is not None:
            user.full_name = command.full_name

        user.updated_at = self._clock.now()
        await self._user_repo.update(user)

        return await to_user_summary(user, self._role_repo)
