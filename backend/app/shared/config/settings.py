"""Environment-driven application settings.

Never import this from `domain/` or `application/` layers — inject values via
constructor parameters instead.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_env: Literal["local", "test", "staging", "production"] = "local"
    app_name: str = "crm-backend"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    database_url: str
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # JWT / password / refresh-token (Identity & Access module)
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_ttl_seconds: int = 900  # 15 minutes
    jwt_refresh_token_ttl_seconds: int = 60 * 60 * 24 * 14  # 14 days
    password_bcrypt_rounds: int = 12

    # Optional bootstrap admin, created on startup if both are set.
    identity_bootstrap_admin_email: str | None = None
    identity_bootstrap_admin_password: str | None = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
