from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.ports.hashing import PasswordHasher
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_permission_repository import (
    SqlAlchemyPermissionRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_role_repository import (
    SqlAlchemyRoleRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.shared.config.settings import Settings

logger = logging.getLogger(__name__)

DEFAULT_PERMISSION_CODES = [
    "User.View",
    "User.Create",
    "User.Update",
    "User.Delete",
    "User.AssignRole",
    "Role.View",
    "Role.Create",
    "Role.Update",
    "Role.Delete",
    "Role.AssignPermission",
    "Permission.View",
    "Permission.Create",
    "Permission.Update",
    "Permission.Delete",
]

ADMIN_ROLE_NAME = "admin"


async def seed_default_permissions_and_admin(
    session: AsyncSession, hasher: PasswordHasher, settings: Settings
) -> None:
    """Idempotent: creates the base permission set and an `admin` role holding
    all of them, and — if both bootstrap env vars are set — an initial admin
    user. Safe to call on every startup."""
    permission_repo = SqlAlchemyPermissionRepository(session)
    role_repo = SqlAlchemyRoleRepository(session)
    user_repo = SqlAlchemyUserRepository(session)

    permission_ids: set[UUID] = set()
    for code in DEFAULT_PERMISSION_CODES:
        existing = await permission_repo.find_by_code(code)
        if existing is None:
            permission = Permission(id=uuid4(), code=code, description=None)
            await permission_repo.add(permission)
            permission_ids.add(permission.id)
        else:
            permission_ids.add(existing.id)

    admin_role = await role_repo.find_by_name(ADMIN_ROLE_NAME)
    if admin_role is None:
        admin_role = Role(
            id=uuid4(), name=ADMIN_ROLE_NAME, description="Full system access", permission_ids=permission_ids
        )
        await role_repo.add(admin_role)
    elif permission_ids - admin_role.permission_ids:
        admin_role.permission_ids |= permission_ids
        await role_repo.update(admin_role)

    if settings.identity_bootstrap_admin_email and settings.identity_bootstrap_admin_password:
        email = settings.identity_bootstrap_admin_email.strip().lower()
        if await user_repo.find_by_email(email) is None:
            now = datetime.now(timezone.utc)
            admin_user = User(
                id=uuid4(),
                email=email,
                hashed_password=hasher.hash(settings.identity_bootstrap_admin_password),
                full_name="Administrator",
                is_active=True,
                is_customer=False,
                created_at=now,
                updated_at=now,
                role_ids={admin_role.id},
            )
            await user_repo.add(admin_user)

    await session.commit()
