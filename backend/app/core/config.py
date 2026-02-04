from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment: development, production
    APP_ENV: str = "development"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.APP_ENV.lower() in ("development", "dev", "local")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.APP_ENV.lower() in ("production", "prod")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/support_panel"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    FRONTEND_URL: str | None = None
    FRONTEND_URLS: list[str] = ["http://localhost:5173", "http://localhost:3001"]

    @property
    def cors_origins(self) -> list[str]:
        origins = list(self.FRONTEND_URLS)
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    # External Services
    KNOWLEDGE_BASE_URL: str = "https://qa.larin.work"
    KNOWLEDGE_BASE_PASSWORD: str = "Parol1234"


settings = Settings()
