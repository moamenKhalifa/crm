import pytest
from pydantic import ValidationError

from app.shared.config.settings import Settings


def test_missing_database_url_raises(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_defaults_applied(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test"
    )
    settings = Settings(_env_file=None)
    assert settings.app_env == "local"
    assert settings.app_port == 8000
    assert settings.database_echo is False
