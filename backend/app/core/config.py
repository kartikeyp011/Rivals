from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_JWKS_URL: str | None = None
    REVENUECAT_WEBHOOK_SECRET: str
    
    CORS_ALLOWED_ORIGINS: str = "*"
    ENVIRONMENT: str = "local"
    LOG_LEVEL: str = "INFO"
    IDEMPOTENCY_KEY_TTL_SECONDS: int = 86400
    WEEKLY_BONUS_COINS: int = 250

    # Usernames matching this regex are hidden from leaderboards and user search
    # (leftover automated-test accounts). Set to an empty string to disable.
    HIDDEN_USERNAME_REGEX: str = r"^(c_zero_|d_zero_|m_user_|z_user_|a_user_|user_)[0-9a-f-]{8,}$"
    
    # Apple Sign-In
    APPLE_TEAM_ID: str | None = None
    APPLE_CLIENT_ID: str | None = None
    APPLE_KEY_ID: str | None = None
    APPLE_PRIVATE_KEY: str | None = None
    
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
