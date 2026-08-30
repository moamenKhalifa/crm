# CRM Backend

## Overview

The CRM backend is a Python service built with **Onion Architecture** inside a
**Modular Monolith**. Every business capability lives in its own module under
`app/modules/`, and every module is internally split into four layers — API,
Application, Domain, and Infrastructure — so business rules stay independent
of frameworks and delivery mechanisms while the whole system still ships and
deploys as a single process.

## Layer rules

Dependencies only point inward. Outer layers may import inner layers; inner
layers must never import outer layers.

| Layer | Responsibility | Allowed to import |
|---|---|---|
| Domain | Business entities, value objects, domain services, repository interfaces (ports) | Standard library only |
| Application | Use cases / application services orchestrating domain logic | `domain`, typing/abstract ports |
| Infrastructure | SQLAlchemy repositories, external clients, mappers — implements ports from `domain`/`application` | `domain`, `application`, third-party libs (SQLAlchemy, etc.) |
| API | FastAPI routers, request/response DTOs — composes use cases via dependency injection | `application`, `domain`, `infrastructure` (for wiring only) |

No `sqlalchemy` import may appear inside any `domain/` or `application/`
package. This is enforced today by `tests/test_layering.py`; a static
import-linter rule is a follow-up.

## Project layout

```
app/
├── main.py
├── shared/
│   ├── config/
│   ├── infrastructure/
│   └── api/
└── modules/
    └── identity_access/
        ├── api/
        ├── application/
        ├── domain/
        └── infrastructure/
```

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Install dependencies: `pip install -e ".[dev]"`

## Local Postgres

Convenience only, not production:

```
docker run --name crm-pg -e POSTGRES_USER=crm -e POSTGRES_PASSWORD=crm -e POSTGRES_DB=crm -p 5432:5432 -d postgres:15
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Required |
|---|---|---|
| `APP_ENV` | `local` | no |
| `APP_NAME` | `crm-backend` | no |
| `APP_HOST` | `0.0.0.0` | no |
| `APP_PORT` | `8000` | no |
| `LOG_LEVEL` | `INFO` | no |
| `DATABASE_URL` | — | **yes** |
| `DATABASE_ECHO` | `false` | no |
| `DATABASE_POOL_SIZE` | `5` | no |
| `DATABASE_MAX_OVERFLOW` | `10` | no |
| `JWT_SECRET` | — | **yes** |
| `JWT_ALGORITHM` | `HS256` | no |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | `900` (15 min) | no |
| `JWT_REFRESH_TOKEN_TTL_SECONDS` | `1209600` (14 days) | no |
| `PASSWORD_BCRYPT_ROUNDS` | `12` | no |
| `IDENTITY_BOOTSTRAP_ADMIN_EMAIL` | — | no |
| `IDENTITY_BOOTSTRAP_ADMIN_PASSWORD` | — | no |

`DATABASE_URL` must use the `postgresql+psycopg://` driver prefix (psycopg 3,
async mode) — e.g. `postgresql+psycopg://crm:crm@localhost:5432/crm`. Using
the plain `postgresql://` prefix will raise `NoSuchModuleError` at first
connection.

If `DATABASE_URL` or `JWT_SECRET` is missing, the app fails fast at startup
with a `pydantic` `ValidationError` before serving any request — this is
intentional so misconfiguration is never silent.

If both `IDENTITY_BOOTSTRAP_ADMIN_EMAIL` and `IDENTITY_BOOTSTRAP_ADMIN_PASSWORD`
are set, an initial admin user (with a seeded `admin` role holding every
default permission) is created on startup — idempotently, safe to leave set
across restarts.

## Migrations

Schema changes are managed with Alembic — never call
`Base.metadata.create_all()`.

```
cd backend
alembic upgrade head      # apply all pending migrations
alembic downgrade base    # roll back everything (dev/test only)
```

The first revision (`0001_identity_access`) creates the six Identity &
Access tables: `users`, `roles`, `permissions`, `user_roles`,
`role_permissions`, `refresh_tokens`.

## Run

```
cd backend
uvicorn app.main:app --reload
```

or from the repository root:

```
uvicorn app.main:app --reload --app-dir backend
```

Expect a log line similar to `Uvicorn running on http://0.0.0.0:8000`.

**Native Windows only:** the plain `uvicorn` command above will crash on
startup with `psycopg.InterfaceError: ... cannot use the 'ProactorEventLoop'`
once a real Postgres connection is attempted — uvicorn resets asyncio's event
loop policy to Windows' Proactor loop during its own startup, which psycopg's
async driver cannot use. Use `python run.py` instead (no `--reload`; see the
docstring in `run.py` for why, and for alternatives). This is a Windows-only
issue — Linux, macOS, WSL2, and CI are unaffected and can use the plain
`uvicorn --reload` command.

## Verify

```
curl -s http://localhost:8000/health
```

- Database up: `{"status":"ok","database":"ok"}`
- Database down: `{"status":"ok","database":"unreachable"}` (still HTTP `200`
  — process liveness is intentionally independent of DB reachability)

Smoke-test Identity & Access:

```
curl -X POST localhost:8000/identity/auth/register -H 'content-type: application/json' \
  -d '{"email":"a@b.co","password":"Passw0rd!","full_name":"A B"}'
curl -X POST localhost:8000/identity/auth/login -H 'content-type: application/json' \
  -d '{"email":"a@b.co","password":"Passw0rd!"}'
curl localhost:8000/identity/auth/me -H "Authorization: Bearer <access_token>"
```

## Testing

```
cd backend
pytest
```

All tests run without a live Postgres instance.

## What is intentionally NOT included yet

- Frontend wiring of the Identity & Access endpoints (tracked as a separate
  follow-up story)
- Password reset / email verification flows
- OAuth / social login
- Multi-tenant isolation
- Audit logging
- CI pipeline
- Docker/Compose for production
- Any CRM business module beyond Identity & Access (tickets, cases,
  dashboards, etc.)
