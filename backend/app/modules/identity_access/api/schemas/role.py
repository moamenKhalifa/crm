from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class RoleSummaryResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None


class CreateRoleRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class UpdateRoleRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class AssignPermissionsRequest(BaseModel):
    permission_ids: list[UUID]
