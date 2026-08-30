from __future__ import annotations

from datetime import datetime, timezone
from typing import overload


@overload
def ensure_utc(value: datetime) -> datetime: ...
@overload
def ensure_utc(value: None) -> None: ...


def ensure_utc(value: datetime | None) -> datetime | None:
    """Normalise a datetime read back from the database to timezone-aware UTC.

    Postgres preserves tzinfo on a `DateTime(timezone=True)` column, but
    SQLite (used in tests, see `tests/conftest.py`) silently drops it on
    round-trip even for that same column type. Values are always written as
    aware UTC, so a naive value read back can only mean "this was UTC."
    """
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value
