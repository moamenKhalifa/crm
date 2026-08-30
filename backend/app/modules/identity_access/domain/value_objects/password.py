from __future__ import annotations

import re
from dataclasses import dataclass

from app.modules.identity_access.domain.errors import WeakPasswordError

_HAS_LETTER = re.compile(r"[A-Za-z]")
_HAS_DIGIT = re.compile(r"\d")
_MIN_LENGTH = 8
_MAX_BYTES = 72


@dataclass(frozen=True)
class RawPassword:
    value: str

    def __post_init__(self) -> None:
        if len(self.value) < _MIN_LENGTH:
            raise WeakPasswordError(f"Password must be at least {_MIN_LENGTH} characters long")
        if not _HAS_LETTER.search(self.value):
            raise WeakPasswordError("Password must contain at least one letter")
        if not _HAS_DIGIT.search(self.value):
            raise WeakPasswordError("Password must contain at least one digit")
        if len(self.value.encode("utf-8")) > _MAX_BYTES:
            raise WeakPasswordError(f"Password must not exceed {_MAX_BYTES} bytes")
