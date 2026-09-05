from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.application.use_cases.permissions.create_permission import (
    CreatePermission,
    CreatePermissionCommand,
)
from app.modules.identity_access.application.use_cases.permissions.delete_permission import DeletePermission
from app.modules.identity_access.application.use_cases.permissions.get_permission import GetPermission
from app.modules.identity_access.application.use_cases.permissions.list_permissions import ListPermissions
from app.modules.identity_access.application.use_cases.permissions.update_permission import (
    UpdatePermission,
    UpdatePermissionCommand,
)
from app.modules.identity_access.infrastructure.composition import build_permission_repo

from ._list_query import parse_list_query
from ..dependencies import get_db_session, require_permission
from ..mapping import permission_to_response
from ..schemas.common import PagedResponse
from ..schemas.permission import CreatePermissionRequest, PermissionSummaryResponse, UpdatePermissionRequest

router = APIRouter()

_PERMISSION_SORT_COLUMNS = frozenset({"code"})


# `response_model` is intentionally omitted here — see the identical comment
# on `list_users` in `users.py` for why.
@router.get(
    "",
    dependencies=[Depends(require_permission("Permission.View"))],
)
async def list_permissions(
    limit: int = 50,
    offset: int = 0,
    q: str | None = None,
    sort: str | None = None,
    paged: bool = False,
    session: AsyncSession = Depends(get_db_session),
):
    query = parse_list_query(
        limit=limit,
        offset=offset,
        q=q,
        sort=sort,
        allowed_sort_columns=_PERMISSION_SORT_COLUMNS,
        filters={},
    )
    use_case = ListPermissions(build_permission_repo(session))
    result = await use_case.execute_paged(query)
    items = [permission_to_response(p) for p in result.items]
    if paged:
        return PagedResponse[PermissionSummaryResponse](
            items=items, total=result.total, limit=query.limit, offset=query.offset
        )
    return items


@router.post(
    "",
    response_model=PermissionSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("Permission.Create"))],
)
async def create_permission(
    body: CreatePermissionRequest, session: AsyncSession = Depends(get_db_session)
) -> PermissionSummaryResponse:
    use_case = CreatePermission(build_permission_repo(session))
    result = await use_case.execute(CreatePermissionCommand(code=body.code, description=body.description))
    return permission_to_response(result)


@router.get(
    "/{permission_id}",
    response_model=PermissionSummaryResponse,
    dependencies=[Depends(require_permission("Permission.View"))],
)
async def get_permission(
    permission_id: UUID, session: AsyncSession = Depends(get_db_session)
) -> PermissionSummaryResponse:
    use_case = GetPermission(build_permission_repo(session))
    result = await use_case.execute(permission_id)
    return permission_to_response(result)


@router.patch(
    "/{permission_id}",
    response_model=PermissionSummaryResponse,
    dependencies=[Depends(require_permission("Permission.Update"))],
)
async def update_permission(
    permission_id: UUID, body: UpdatePermissionRequest, session: AsyncSession = Depends(get_db_session)
) -> PermissionSummaryResponse:
    use_case = UpdatePermission(build_permission_repo(session))
    result = await use_case.execute(
        UpdatePermissionCommand(permission_id=permission_id, code=body.code, description=body.description)
    )
    return permission_to_response(result)


@router.delete(
    "/{permission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    dependencies=[Depends(require_permission("Permission.Delete"))],
)
async def delete_permission(permission_id: UUID, session: AsyncSession = Depends(get_db_session)) -> None:
    use_case = DeletePermission(build_permission_repo(session))
    await use_case.execute(permission_id)
