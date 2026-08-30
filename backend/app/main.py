import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError

from app.modules.identity_access.api.error_handlers import register_error_handlers
from app.modules.identity_access.api.router import router as identity_router
from app.modules.identity_access.infrastructure.composition import build_password_hasher
from app.modules.identity_access.infrastructure.seed import seed_default_permissions_and_admin
from app.shared.api.health import router as health_router
from app.shared.config.settings import Settings, get_settings
from app.shared.infrastructure.database import dispose_engine, get_session_factory, init_engine
from app.shared.logging import configure_logging

logger = logging.getLogger(__name__)


async def _bootstrap_identity_access(settings: Settings) -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        hasher = build_password_hasher(settings)
        await seed_default_permissions_and_admin(session, hasher, settings)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    init_engine(settings)
    try:
        # Never block startup on the database — mirrors the health-check
        # philosophy (see backend/docs/architecture.md): liveness must not
        # depend on a dependency the process cannot control.
        await _bootstrap_identity_access(settings)
    except SQLAlchemyError:
        logger.warning("Identity & Access bootstrap skipped: database unavailable", exc_info=True)
    try:
        yield
    finally:
        await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(identity_router, prefix="/identity", tags=["identity-access"])
    return app


app = create_app()
