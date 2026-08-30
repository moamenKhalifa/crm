from __future__ import annotations

from app.modules.identity_access.domain.entities.permission import Permission
from app.modules.identity_access.domain.entities.role import Role
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.domain.ports.repositories import RoleRepository

from .dto import PermissionSummary, RoleSummary, UserSummary


def to_role_summary(role: Role) -> RoleSummary:
    return RoleSummary(id=role.id, name=role.name, description=role.description)


def to_permission_summary(permission: Permission) -> PermissionSummary:
    return PermissionSummary(id=permission.id, code=permission.code, description=permission.description)


async def to_user_summary(user: User, role_repo: RoleRepository) -> UserSummary:
    roles = await role_repo.find_by_ids(user.role_ids) if user.role_ids else []
    return UserSummary(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_customer=user.is_customer,
        roles=[to_role_summary(role) for role in roles],
    )
