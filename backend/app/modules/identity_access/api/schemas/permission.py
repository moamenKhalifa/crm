from __future__ import annotations

from pydantic import BaseModel, Field
from uuid import UUID


class PermissionSummaryResponse(BaseModel):
    id: UUID
    code: str
    description: str | None = None


class CreatePermissionRequest(BaseModel):
    code: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=500)


class UpdatePermissionRequest(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=500)
