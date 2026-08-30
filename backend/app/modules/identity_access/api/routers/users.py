from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.application.use_cases.users.assign_roles_to_user import (
    AssignRolesToUser,
    AssignRolesToUserCommand,
)
from app.modules.identity_access.application.use_cases.users.create_user import CreateUser, CreateUserCommand
from app.modules.identity_access.application.use_cases.users.delete_user import DeleteUser
from app.modules.identity_access.application.use_cases.users.get_user import GetUser
from app.modules.identity_access.application.use_cases.users.get_user_roles import GetUserRoles
from app.modules.identity_access.application.use_cases.users.list_users import ListUsers
from app.modules.identity_access.application.use_cases.users.set_user_active import (
    SetUserActive,
    SetUserActiveCommand,
)
from app.modules.identity_access.application.use_cases.users.update_user import UpdateUser, UpdateUserCommand
from app.modules.identity_access.infrastructure.composition import (
    build_clock,
    build_password_hasher,
    build_role_repo,
    build_user_repo,
)
from app.shared.config.settings import Settings, get_settings

from ..dependencies import get_db_session, require_permission
from ..mapping import role_to_response, user_to_response
from ..schemas.role import RoleSummaryResponse
from ..schemas.user import (
    AssignRolesRequest,
    CreateUserRequest,
    SetUserActiveRequest,
    UpdateUserRequest,
    UserResponse,
)

router = APIRouter()


@router.get("", response_model=list[UserResponse], dependencies=[Depends(require_permission("User.View"))])
async def list_users(
    limit: int = 50, offset: int = 0, session: AsyncSession = Depends(get_db_session)
) -> list[UserResponse]:
    use_case = ListUsers(build_user_repo(session), build_role_repo(session))
    results = await use_case.execute(limit=limit, offset=offset)
    return [user_to_response(r) for r in results]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("User.Create"))],
)
async def create_user(
    body: CreateUserRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    use_case = CreateUser(
        build_user_repo(session), build_role_repo(session), build_password_hasher(settings), build_clock()
    )
    result = await use_case.execute(
        CreateUserCommand(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            is_customer=body.is_customer,
            role_ids=frozenset(body.role_ids),
        )
    )
    return user_to_response(result)


@router.get(
    "/{user_id}", response_model=UserResponse, dependencies=[Depends(require_permission("User.View"))]
)
async def get_user(user_id: UUID, session: AsyncSession = Depends(get_db_session)) -> UserResponse:
    use_case = GetUser(build_user_repo(session), build_role_repo(session))
    result = await use_case.execute(user_id)
    return user_to_response(result)


@router.patch(
    "/{user_id}", response_model=UserResponse, dependencies=[Depends(require_permission("User.Update"))]
)
async def update_user(
    user_id: UUID, body: UpdateUserRequest, session: AsyncSession = Depends(get_db_session)
) -> UserResponse:
    use_case = UpdateUser(build_user_repo(session), build_role_repo(session), build_clock())
    result = await use_case.execute(
        UpdateUserCommand(user_id=user_id, full_name=body.full_name, email=body.email)
    )
    return user_to_response(result)


@router.patch(
    "/{user_id}/active",
    response_model=UserResponse,
    dependencies=[Depends(require_permission("User.Update"))],
)
async def set_user_active(
    user_id: UUID, body: SetUserActiveRequest, session: AsyncSession = Depends(get_db_session)
) -> UserResponse:
    use_case = SetUserActive(build_user_repo(session), build_role_repo(session), build_clock())
    result = await use_case.execute(SetUserActiveCommand(user_id=user_id, is_active=body.is_active))
    return user_to_response(result)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    dependencies=[Depends(require_permission("User.Delete"))],
)
async def delete_user(user_id: UUID, session: AsyncSession = Depends(get_db_session)) -> None:
    use_case = DeleteUser(build_user_repo(session))
    await use_case.execute(user_id)


@router.put(
    "/{user_id}/roles",
    response_model=UserResponse,
    dependencies=[Depends(require_permission("User.AssignRole"))],
)
async def assign_roles(
    user_id: UUID, body: AssignRolesRequest, session: AsyncSession = Depends(get_db_session)
) -> UserResponse:
    use_case = AssignRolesToUser(build_user_repo(session), build_role_repo(session), build_clock())
    result = await use_case.execute(
        AssignRolesToUserCommand(user_id=user_id, role_ids=frozenset(body.role_ids))
    )
    return user_to_response(result)


@router.get(
    "/{user_id}/roles",
    response_model=list[RoleSummaryResponse],
    dependencies=[Depends(require_permission("User.View"))],
)
async def get_user_roles(
    user_id: UUID, session: AsyncSession = Depends(get_db_session)
) -> list[RoleSummaryResponse]:
    use_case = GetUserRoles(build_user_repo(session), build_role_repo(session))
    results = await use_case.execute(user_id)
    return [role_to_response(r) for r in results]
