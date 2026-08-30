from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.errors import DuplicateAccountError
from app.modules.identity_access.domain.ports.clock import Clock
from app.modules.identity_access.domain.ports.hashing import PasswordHasher
from app.modules.identity_access.domain.ports.repositories import UserRepository
from app.modules.identity_access.domain.value_objects.email import Email
from app.modules.identity_access.domain.value_objects.password import RawPassword

from ..dto import UserSummary


@dataclass(frozen=True)
class RegisterCustomerCommand:
    email: str
    password: str
    full_name: str


class RegisterCustomer:
    def __init__(self, user_repo: UserRepository, hasher: PasswordHasher, clock: Clock) -> None:
        self._user_repo = user_repo
        self._hasher = hasher
        self._clock = clock

    async def execute(self, command: RegisterCustomerCommand) -> UserSummary:
        email = Email(command.email)
        RawPassword(command.password)  # validates strength; raises WeakPasswordError

        if await self._user_repo.find_by_email(str(email)) is not None:
            raise DuplicateAccountError(f"An account with email {email} already exists")

        now = self._clock.now()
        user = User(
            id=uuid4(),
            email=str(email),
            hashed_password=self._hasher.hash(command.password),
            full_name=command.full_name,
            is_active=True,
            is_customer=True,
            created_at=now,
            updated_at=now,
            role_ids=set(),
        )
        # The repository also enforces the unique-email constraint at the DB
        # level (case-insensitive) and translates IntegrityError into
        # DuplicateAccountError, covering the race between the check above
        # and this insert.
        await self._user_repo.add(user)

        return UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_customer=user.is_customer,
            roles=[],
        )
