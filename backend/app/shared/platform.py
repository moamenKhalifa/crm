"""Platform-specific asyncio setup."""

from __future__ import annotations

import asyncio
import sys


def ensure_windows_selector_event_loop() -> None:
    """psycopg's async mode cannot run on asyncio's default `ProactorEventLoop`
    on Windows — it requires `SelectorEventLoop`. Must be called before any
    event loop is created (i.e. at module import time, before uvicorn or
    `asyncio.run()` starts one); a no-op on every other platform.
    """
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
