from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity_access.application.mappers import to_user_summary
from app.modules.identity_access.application.use_cases.login import Login, LoginCommand
from app.modules.identity_access.application.use_cases.logout import Logout, LogoutCommand
from app.modules.identity_access.application.use_cases.refresh_token import (
    RefreshToken as RefreshTokenUseCase,
)
from app.modules.identity_access.application.use_cases.refresh_token import RefreshTokenCommand
from app.modules.identity_access.application.use_cases.register_customer import (
    RegisterCustomer,
    RegisterCustomerCommand,
)
from app.modules.identity_access.domain.entities.user import User
from app.modules.identity_access.infrastructure.composition import (
    build_access_issuer,
    build_clock,
    build_password_hasher,
    build_permission_repo,
    build_refresh_issuer,
    build_refresh_token_repo,
    build_role_repo,
    build_user_repo,
)
from app.shared.config.settings import Settings, get_settings

from ..dependencies import get_current_user, get_db_session
from ..mapping import tokens_to_response, user_to_response
from ..schemas.auth import LoginRequest, RefreshRequest, RegisterCustomerRequest, TokenPairResponse
from ..schemas.user import UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterCustomerRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    use_case = RegisterCustomer(build_user_repo(session), build_password_hasher(settings), build_clock())
    result = await use_case.execute(
        RegisterCustomerCommand(email=body.email, password=body.password, full_name=body.full_name)
    )
    return user_to_response(result)


@router.post("/login", response_model=TokenPairResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> TokenPairResponse:
    clock = build_clock()
    use_case = Login(
        user_repo=build_user_repo(session),
        role_repo=build_role_repo(session),
        permission_repo=build_permission_repo(session),
        refresh_repo=build_refresh_token_repo(session),
        hasher=build_password_hasher(settings),
        access_issuer=build_access_issuer(settings, clock),
        refresh_issuer=build_refresh_issuer(settings, clock),
        clock=clock,
        access_ttl_seconds=settings.jwt_access_token_ttl_seconds,
        refresh_ttl_seconds=settings.jwt_refresh_token_ttl_seconds,
    )
    result = await use_case.execute(LoginCommand(email=body.email, password=body.password))
    return tokens_to_response(result.tokens)


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh(
    body: RefreshRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> TokenPairResponse:
    clock = build_clock()
    use_case = RefreshTokenUseCase(
        refresh_repo=build_refresh_token_repo(session),
        user_repo=build_user_repo(session),
        role_repo=build_role_repo(session),
        permission_repo=build_permission_repo(session),
        access_issuer=build_access_issuer(settings, clock),
        refresh_issuer=build_refresh_issuer(settings, clock),
        clock=clock,
        access_ttl_seconds=settings.jwt_access_token_ttl_seconds,
        refresh_ttl_seconds=settings.jwt_refresh_token_ttl_seconds,
    )
    result = await use_case.execute(RefreshTokenCommand(refresh_token=body.refresh_token))
    return tokens_to_response(result)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def logout(
    body: RefreshRequest,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> None:
    clock = build_clock()
    use_case = Logout(build_refresh_token_repo(session), build_refresh_issuer(settings, clock), clock)
    await use_case.execute(LogoutCommand(refresh_token=body.refresh_token))


@router.get("/me", response_model=UserResponse)
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    summary = await to_user_summary(user, build_role_repo(session))
    return user_to_response(summary)
