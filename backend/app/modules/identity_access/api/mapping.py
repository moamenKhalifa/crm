from __future__ import annotations

from app.modules.identity_access.application.dto import (
    PermissionSummary,
    RoleSummary,
    TokenPair,
    UserSummary,
)

from .schemas.auth import TokenPairResponse
from .schemas.permission import PermissionSummaryResponse
from .schemas.role import RoleSummaryResponse
from .schemas.user import UserResponse


def role_to_response(role: RoleSummary) -> RoleSummaryResponse:
    return RoleSummaryResponse(id=role.id, name=role.name, description=role.description)


def permission_to_response(permission: PermissionSummary) -> PermissionSummaryResponse:
    return PermissionSummaryResponse(id=permission.id, code=permission.code, description=permission.description)


def user_to_response(user: UserSummary) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_customer=user.is_customer,
        roles=[role_to_response(role) for role in user.roles],
    )


def tokens_to_response(tokens: TokenPair) -> TokenPairResponse:
    return TokenPairResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_expires_in=tokens.access_expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
    )
