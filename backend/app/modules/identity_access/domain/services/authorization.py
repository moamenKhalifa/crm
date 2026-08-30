from __future__ import annotations


def has_permission(user_permission_codes: set[str], required: str) -> bool:
    return required in user_permission_codes
