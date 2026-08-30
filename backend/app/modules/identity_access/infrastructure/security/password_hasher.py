from __future__ import annotations

from passlib.context import CryptContext


class PasslibBcryptHasher:
    def __init__(self, rounds: int = 12) -> None:
        self._context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=rounds)

    def hash(self, raw: str) -> str:
        return self._context.hash(raw)

    def verify(self, raw: str, hashed: str) -> bool:
        try:
            return self._context.verify(raw, hashed)
        except ValueError:
            return False
