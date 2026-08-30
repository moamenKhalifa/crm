import pytest

from app.shared.infrastructure import database


async def test_get_session_factory_without_init_raises():
    await database.dispose_engine()

    with pytest.raises(RuntimeError):
        database.get_session_factory()
