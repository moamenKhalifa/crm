from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass
class Permission:
    id: UUID
    code: str
    description: str | None
