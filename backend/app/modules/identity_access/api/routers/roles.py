from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.application.use_cases.roles.assign_permissions_to_role import (
    AssignPermissionsToRole,
    AssignPermissionsToRoleCommand,
)
from app.modules.identity_access.application.use_cases.roles.create_role import CreateRole, CreateRoleCommand
from app.modules.identity_access.application.use_cases.roles.delete_role import DeleteRole
from app.modules.identity_access.application.use_cases.roles.get_role import GetRole
from app.modules.identity_access.application.use_cases.roles.get_role_permissions import GetRolePermissions
from app.modules.identity_access.application.use_cases.roles.list_roles import ListRoles
from app.modules.identity_access.application.use_cases.roles.remove_permissions_from_role import (
    RemovePermissionsFromRole,
    RemovePermissionsFromRoleCommand,
)
from app.modules.identity_access.application.use_cases.roles.update_role import UpdateRole, UpdateRoleCommand
from app.modules.identity_access.infrastructure.composition import build_permission_repo, build_role_repo

from ._list_query import parse_list_query
from ..dependencies import get_db_session, require_permission
from ..mapping import permission_to_response, role_to_response
from ..schemas.common import PagedResponse
from ..schemas.permission import PermissionSummaryResponse
from ..schemas.role import (
    AssignPermissionsRequest,
    CreateRoleRequest,
    RoleSummaryResponse,
    UpdateRoleRequest,
)

router = APIRouter()

_ROLE_SORT_COLUMNS = frozenset({"name"})


# `response_model` is intentionally omitted here — see the identical comment
# on `list_users` in `users.py` for why.
@router.get("", dependencies=[Depends(require_permission("Role.View"))])
async def list_roles(
    limit: int = 50,
    offset: int = 0,
    q: str | None = None,
    sort: str | None = None,
    has_permission_id: list[UUID] = Query(default=[]),
    paged: bool = False,
    session: AsyncSession = Depends(get_db_session),
):
    query = parse_list_query(
        limit=limit,
        offset=offset,
        q=q,
        sort=sort,
        allowed_sort_columns=_ROLE_SORT_COLUMNS,
        filters={"has_permission_id": tuple(str(p) for p in has_permission_id)},
    )
    use_case = ListRoles(build_role_repo(session))
    result = await use_case.execute_paged(query)
    items = [role_to_response(r) for r in result.items]
    if paged:
        return PagedResponse[RoleSummaryResponse](
            items=items, total=result.total, limit=query.limit, offset=query.offset
        )
    return items


@router.post(
    "",
    response_model=RoleSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("Role.Create"))],
)
async def create_role(
    body: CreateRoleRequest, session: AsyncSession = Depends(get_db_session)
) -> RoleSummaryResponse:
    use_case = CreateRole(build_role_repo(session))
    result = await use_case.execute(CreateRoleCommand(name=body.name, description=body.description))
    return role_to_response(result)


@router.get(
    "/{role_id}", response_model=RoleSummaryResponse, dependencies=[Depends(require_permission("Role.View"))]
)
async def get_role(role_id: UUID, session: AsyncSession = Depends(get_db_session)) -> RoleSummaryResponse:
    use_case = GetRole(build_role_repo(session))
    result = await use_case.execute(role_id)
    return role_to_response(result)


@router.patch(
    "/{role_id}", response_model=RoleSummaryResponse, dependencies=[Depends(require_permission("Role.Update"))]
)
async def update_role(
    role_id: UUID, body: UpdateRoleRequest, session: AsyncSession = Depends(get_db_session)
) -> RoleSummaryResponse:
    use_case = UpdateRole(build_role_repo(session))
    result = await use_case.execute(
        UpdateRoleCommand(role_id=role_id, name=body.name, description=body.description)
    )
    return role_to_response(result)


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    dependencies=[Depends(require_permission("Role.Delete"))],
)
async def delete_role(role_id: UUID, session: AsyncSession = Depends(get_db_session)) -> None:
    use_case = DeleteRole(build_role_repo(session))
    await use_case.execute(role_id)


@router.put(
    "/{role_id}/permissions",
    response_model=RoleSummaryResponse,
    dependencies=[Depends(require_permission("Role.AssignPermission"))],
)
async def assign_permissions(
    role_id: UUID, body: AssignPermissionsRequest, session: AsyncSession = Depends(get_db_session)
) -> RoleSummaryResponse:
    use_case = AssignPermissionsToRole(build_role_repo(session), build_permission_repo(session))
    result = await use_case.execute(
        AssignPermissionsToRoleCommand(role_id=role_id, permission_ids=frozenset(body.permission_ids))
    )
    return role_to_response(result)


@router.delete(
    "/{role_id}/permissions",
    response_model=RoleSummaryResponse,
    dependencies=[Depends(require_permission("Role.AssignPermission"))],
)
async def remove_permissions(
    role_id: UUID, body: AssignPermissionsRequest, session: AsyncSession = Depends(get_db_session)
) -> RoleSummaryResponse:
    use_case = RemovePermissionsFromRole(build_role_repo(session))
    result = await use_case.execute(
        RemovePermissionsFromRoleCommand(role_id=role_id, permission_ids=frozenset(body.permission_ids))
    )
    return role_to_response(result)


@router.get(
    "/{role_id}/permissions",
    response_model=list[PermissionSummaryResponse],
    dependencies=[Depends(require_permission("Role.View"))],
)
async def get_role_permissions(
    role_id: UUID, session: AsyncSession = Depends(get_db_session)
) -> list[PermissionSummaryResponse]:
    use_case = GetRolePermissions(build_role_repo(session), build_permission_repo(session))
    results = await use_case.execute(role_id)
    return [permission_to_response(p) for p in results]
