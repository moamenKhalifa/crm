from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class User:
    id: UUID
    email: str
    hashed_password: str
    full_name: str
    is_active: bool
    is_customer: bool
    created_at: datetime
    updated_at: datetime
    role_ids: set[UUID] = field(default_factory=set)
