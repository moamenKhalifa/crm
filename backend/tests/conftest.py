import os

# `app.main` builds a module-level `app = create_app()` at import time (so
# `uvicorn app.main:app` works), which requires `DATABASE_URL`/`JWT_SECRET` to
# already be set. Provide placeholders before the first import so test
# collection doesn't fail; individual tests still control the value via
# `settings_env`.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-pytest-only-32b")

from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import create_app
from app.modules.identity_access.api.dependencies import get_db_session
from app.modules.identity_access.domain.entities.user import User

# Populate the shared declarative Base's metadata with the identity_access
# tables so `Base.metadata.create_all` below creates them in the in-memory
# SQLite schema used by API tests.
from app.modules.identity_access.infrastructure.orm import models as _identity_access_models  # noqa: F401
from app.modules.identity_access.infrastructure.composition import build_clock, build_password_hasher
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_role_repository import (
    SqlAlchemyRoleRepository,
)
from app.modules.identity_access.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.modules.identity_access.infrastructure.seed import seed_default_permissions_and_admin
from app.shared.config.settings import get_settings
from app.shared.infrastructure.orm.base import Base


@pytest.fixture
def settings_env(monkeypatch):
    """Provide valid required settings and reset the cached Settings singleton.

    `get_settings()` is `lru_cache`d, so any test that mutates env vars must
    clear the cache before and after, otherwise a stale Settings instance
    leaks into other tests.
    """
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-for-pytest-only-32b")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest_asyncio.fixture
async def db_session_override(settings_env):
    """A SQLite in-memory engine standing in for Postgres in API tests, plus
    the FastAPI dependency-override callable that yields sessions from it.

    `StaticPool` keeps every connection on the same in-memory database —
    without it, each checked-out connection would see its own empty
    `:memory:` database and nothing written by a previous session would be
    visible to the next one.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    # SQLite ignores `ON DELETE CASCADE` (and all FK constraints) unless this
    # pragma is set per-connection — Postgres enforces them unconditionally.
    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async def _override():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    yield session_factory, _override
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session_override):
    _session_factory, override = db_session_override
    app = create_app()
    app.dependency_overrides[get_db_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_client(client, db_session_override):
    """An httpx client authenticated as a freshly-seeded admin user (full
    default permission set via the `admin` role)."""
    session_factory, _override = db_session_override
    settings = get_settings()
    hasher = build_password_hasher(settings)
    clock = build_clock()

    admin_email = "admin-fixture@example.com"
    admin_password = "AdminPass1"

    async with session_factory() as session:
        await seed_default_permissions_and_admin(session, hasher, settings)
        role_repo = SqlAlchemyRoleRepository(session)
        user_repo = SqlAlchemyUserRepository(session)
        admin_role = await role_repo.find_by_name("admin")
        now = clock.now()
        await user_repo.add(
            User(
                id=uuid4(),
                email=admin_email,
                hashed_password=hasher.hash(admin_password),
                full_name="Test Admin",
                is_active=True,
                is_customer=False,
                created_at=now,
                updated_at=now,
                role_ids={admin_role.id},
            )
        )
        await session.commit()

    response = await client.post(
        "/identity/auth/login", json={"email": admin_email, "password": admin_password}
    )
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    yield client


@pytest_asyncio.fixture
async def customer_client(client):
    """An httpx client authenticated as a freshly self-registered customer
    (no roles, no permissions)."""
    email = "customer-fixture@example.com"
    password = "CustomerPass1"
    await client.post(
        "/identity/auth/register",
        json={"email": email, "password": password, "full_name": "Test Customer"},
    )
    response = await client.post("/identity/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    yield client
