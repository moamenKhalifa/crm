from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID, uuid4

from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import DuplicateAccountError, RoleNotFoundError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.hashing import PasswordHasher
from app.modules.identity_access.domain.ports.repositories import RoleRepository, UserRepository
from app.modules.identity_access.domain.value_objects.email import Email
from app.modules.identity_access.domain.value_objects.password import RawPassword

from ...dto import UserSummary
from ...mappers import to_role_summary


@dataclass(frozen=True)
class CreateUserCommand:
    email: str
    password: str
    full_name: str
    is_customer: bool = False
    role_ids: frozenset[UUID] = field(default_factory=frozenset)


class CreateUser:
    def __init__(
        self, user_repo: UserRepository, role_repo: RoleRepository, hasher: PasswordHasher, clock: Clock
    ) -> None:
        self._user_repo = user_repo
        self._role_repo = role_repo
        self._hasher = hasher
        self._clock = clock

    async def execute(self, command: CreateUserCommand) -> UserSummary:
        email = Email(command.email)
        RawPassword(command.password)

        if await self._user_repo.find_by_email(str(email)) is not None:
            raise DuplicateAccountError(f"An account with email {email} already exists")

        roles = []
        if command.role_ids:
            roles = await self._role_repo.find_by_ids(set(command.role_ids))
            missing = set(command.role_ids) - {role.id for role in roles}
            if missing:
                raise RoleNotFoundError(f"Unknown role id(s): {sorted(str(i) for i in missing)}")

        now = self._clock.now()
        user = User(
            id=uuid4(),
            email=str(email),
            hashed_password=self._hasher.hash(command.password),
            full_name=command.full_name,
            is_active=True,
            is_customer=command.is_customer,
            created_at=now,
            updated_at=now,
            role_ids={role.id for role in roles},
        )
        await self._user_repo.add(user)

        return UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_customer=user.is_customer,
            roles=[to_role_summary(role) for role in roles],
        )
