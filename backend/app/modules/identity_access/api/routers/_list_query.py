from __future__ import annotations

from fastapi import HTTPException

from app.modules.identity_access.application.dto import ListQuery, SortDir


def parse_list_query(
    *,
    limit: int,
    offset: int,
    q: str | None,
    sort: str | None,
    allowed_sort_columns: frozenset[str],
    filters: dict[str, tuple[str, ...]],
) -> ListQuery:
    """Build a `ListQuery` from raw router query params.

    `sort` is a `"<column>"` or `"<column>:asc|desc"` token. An unknown
    column raises `HTTPException(400)` directly — the existing
    `_handle_http_exception` fallback in `api/error_handlers.py` maps it to
    the `{"error": {"code": "http_error", ...}}` envelope without needing a
    new domain error class.
    """
    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)

    sort_by: str | None = None
    sort_dir: SortDir = "asc"
    if sort:
        column, _, direction = sort.partition(":")
        if column not in allowed_sort_columns:
            raise HTTPException(status_code=400, detail=f"Unknown sort column: {column}")
        sort_by = column
        if direction in ("asc", "desc"):
            sort_dir = direction  # type: ignore[assignment]

    return ListQuery(limit=limit, offset=offset, q=q, sort_by=sort_by, sort_dir=sort_dir, filters=filters)
