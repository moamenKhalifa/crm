from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from .role import RoleSummaryResponse


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_customer: bool
    roles: list[RoleSummaryResponse]


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    is_customer: bool = False
    role_ids: list[UUID] = Field(default_factory=list)


class UpdateUserRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=200)


class SetUserActiveRequest(BaseModel):
    is_active: bool


class AssignRolesRequest(BaseModel):
    role_ids: list[UUID]
