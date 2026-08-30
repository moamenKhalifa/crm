from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class Role:
    id: UUID
    name: str
    description: str | None
    permission_ids: set[UUID] = field(default_factory=set)
