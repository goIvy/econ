"""Settings from environment variables. Never hard-code secrets."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./cvl-dev.db")
    cors_origins: tuple[str, ...] = tuple(o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip())
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
    admin_token: str | None = os.getenv("ADMIN_TOKEN")  # required for /admin routes; unset disables them


settings = Settings()
