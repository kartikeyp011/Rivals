from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_JWKS_URL: str | None = None
    
    CORS_ALLOWED_ORIGINS: str = "*"
    ENVIRONMENT: str = "local"
    LOG_LEVEL: str = "INFO"
    IDEMPOTENCY_KEY_TTL_SECONDS: int = 86400
    
    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
