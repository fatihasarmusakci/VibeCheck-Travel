from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "VibeCheck API"
    debug: bool = False

    database_url: str = Field(
        default="sqlite+aiosqlite:///./vibecheck.db",
        description="Async SQLAlchemy URL (PostgreSQL recommended for production).",
    )
    sync_database_url: str = Field(
        default="sqlite:///./vibecheck.db",
        description="Sync URL for Celery workers (must point to the same DB file as sqlite dev).",
    )

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    celery_eager: bool = Field(
        default=False,
        description="If true, Celery tasks run in-process (useful for tests/local without Redis).",
    )

    default_review_source: str = "booking"


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
