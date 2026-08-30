from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.modules.identity_access.domain.errors import (
    DuplicateAccountError,
    DuplicatePermissionError,
    DuplicateRoleError,
    IdentityError,
    InvalidCredentialsError,
    InvalidEmailError,
    PermissionDeniedError,
    PermissionNotFoundError,
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError,
    RoleNotFoundError,
    UserNotFoundError,
    WeakPasswordError,
)

logger = logging.getLogger(__name__)


def _envelope(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


# Order matters only in that every concrete error below is a direct,
# non-overlapping subclass of IdentityError — no ambiguity in match order.
_DOMAIN_ERROR_MAP: list[tuple[type[IdentityError], int, str]] = [
    (InvalidCredentialsError, status.HTTP_401_UNAUTHORIZED, "invalid_credentials"),
    (RefreshTokenInvalidError, status.HTTP_401_UNAUTHORIZED, "invalid_refresh_token"),
    (RefreshTokenExpiredError, status.HTTP_401_UNAUTHORIZED, "expired_refresh_token"),
    (RefreshTokenRevokedError, status.HTTP_401_UNAUTHORIZED, "revoked_refresh_token"),
    (PermissionDeniedError, status.HTTP_403_FORBIDDEN, "insufficient_permissions"),
    (DuplicateAccountError, status.HTTP_409_CONFLICT, "duplicate_account"),
    (DuplicateRoleError, status.HTTP_409_CONFLICT, "duplicate_role"),
    (DuplicatePermissionError, status.HTTP_409_CONFLICT, "duplicate_permission"),
    (UserNotFoundError, status.HTTP_404_NOT_FOUND, "not_found"),
    (RoleNotFoundError, status.HTTP_404_NOT_FOUND, "not_found"),
    (PermissionNotFoundError, status.HTTP_404_NOT_FOUND, "not_found"),
    (WeakPasswordError, status.HTTP_422_UNPROCESSABLE_ENTITY, "validation_failed"),
    (InvalidEmailError, status.HTTP_422_UNPROCESSABLE_ENTITY, "validation_failed"),
]


async def _handle_domain_error(request: Request, exc: IdentityError) -> JSONResponse:
    for error_type, status_code, code in _DOMAIN_ERROR_MAP:
        if isinstance(exc, error_type):
            return JSONResponse(status_code=status_code, content=_envelope(code, str(exc)))
    # A bare IdentityError (or a new subclass not yet mapped above) is a
    # programming error, not something the client can act on.
    logger.exception("Unmapped identity domain error")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_envelope("internal_error", "An unexpected error occurred."),
    )


async def _handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_envelope("validation_failed", "Request validation failed."),
    )


_STATUS_CODE_FALLBACK = {
    status.HTTP_401_UNAUTHORIZED: "unauthenticated",
    status.HTTP_403_FORBIDDEN: "insufficient_permissions",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_409_CONFLICT: "duplicate_record",
    status.HTTP_422_UNPROCESSABLE_ENTITY: "validation_failed",
}


async def _handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "code" in exc.detail and "message" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code, content=_envelope(exc.detail["code"], exc.detail["message"])
        )

    code = _STATUS_CODE_FALLBACK.get(exc.status_code, "http_error")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(status_code=exc.status_code, content=_envelope(code, message))


async def _handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_envelope("internal_error", "An unexpected error occurred."),
    )


def register_error_handlers(app: FastAPI) -> None:
    # Starlette's `add_exception_handler` signature is contravariant on the
    # exception parameter (it wants `Callable[[Request, Exception], ...]`),
    # so mypy flags every handler typed to its own narrower exception class —
    # this is the standard, widely-used pattern for FastAPI exception handlers.
    app.add_exception_handler(IdentityError, _handle_domain_error)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, _handle_validation_error)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, _handle_http_exception)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _handle_unexpected_error)
