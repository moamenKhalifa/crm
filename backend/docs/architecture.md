# Architecture

## Why Onion Architecture

Business rules (the domain) are the most valuable and least volatile part of
the system, so they should not depend on frameworks, databases, or delivery
mechanisms. Onion Architecture enforces dependency inversion: outer layers
(API, Infrastructure) depend inward on Application and Domain, never the
reverse. This keeps the domain testable in isolation and makes it possible to
swap infrastructure (e.g. the database driver) without touching business
logic.

## Why Modular Monolith over microservices at day one

A single deployable process is simpler to build, test, and operate while the
team and domain model are still forming. Splitting the codebase into modules
(each with its own api/application/domain/infrastructure layers) gives the
same separation of concerns and a clear extraction boundary for a future
microservice, without paying the operational cost of distributed systems
before it's needed.

## Zero third-party imports in the domain

`domain/` packages may only import the Python standard library. No
SQLAlchemy, no Pydantic, no FastAPI. This guarantees domain code can be
tested and reasoned about without booting a framework or a database, and
prevents infrastructure concerns from leaking into business rules.

## API routers never call SQLAlchemy directly

`api/` routers depend only on application services, which in turn depend on
repository ports (interfaces) defined in `domain/` or `application/`.
Infrastructure provides the concrete SQLAlchemy implementations of those
ports and is wired in at the composition root (`app/main.py`). This keeps
persistence swappable and keeps request handlers free of business logic.

## Adding a new module

Copy the `app/modules/identity_access/` tree (api/application/domain/
infrastructure, each with an `__init__.py` and a `README.md` describing its
allowed imports) under `app/modules/<new_module>/`, then wire its router into
`app/main.py`.

## Notes on startup and schema

- `init_engine()` only builds a lazy SQLAlchemy engine; it does not open a
  connection. If Postgres is unreachable at startup, the process still boots
  — the first `check_database()` call (via `/health`) surfaces the failure.
- Do **not** call `Base.metadata.create_all()` anywhere. No tables are
  created by this story, and schema management will be handled by Alembic
  migrations in a future story, not by ad-hoc `create_all` calls.
