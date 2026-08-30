"""Dev server launcher for Windows.

`uvicorn app.main:app` resets asyncio's event loop policy back to the
platform default during its own startup (`Config.setup_event_loop()`, called
before the app module is even imported) — on Windows that default is
`ProactorEventLoop`, which psycopg's async driver cannot use. Running the
server through `Server.serve()` directly (skipping `Server.run()`, which is
what calls `setup_event_loop()`) keeps our own `SelectorEventLoop` policy in
effect for the whole process, so async Postgres connections work.

Usage: `python run.py` (from `backend/`). Does not support `--reload` — the
reload supervisor spawns subprocess workers that require `ProactorEventLoop`
on Windows, which is the exact thing this script avoids. For iterative dev
with autoreload, either restart manually after code changes, or point
`DATABASE_URL` at SQLite (no such restriction) and use
`uvicorn app.main:app --reload` instead. On Linux/macOS/CI this whole issue
does not exist — `uvicorn app.main:app --reload` works there unmodified.
"""

import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn  # noqa: E402  (must import after the policy is set)

from app.shared.config.settings import get_settings  # noqa: E402


def main() -> None:
    settings = get_settings()
    config = uvicorn.Config(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        log_level=settings.log_level.lower(),
    )
    server = uvicorn.Server(config)
    asyncio.run(server.serve())


if __name__ == "__main__":
    main()
