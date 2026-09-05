from __future__ import annotations


class RoleName:
    """Role names are stored lower-case so case-only variants (e.g. ``Admin``
    vs ``admin``) can never coexist; normalise at construction time so every
    caller gets the canonical form."""

    __slots__ = ("value",)

    def __init__(self, raw: str) -> None:
        normalised = raw.strip().lower()
        if not normalised:
            raise ValueError("role name must be non-empty")
        self.value = normalised

    def __str__(self) -> str:
        return self.value
