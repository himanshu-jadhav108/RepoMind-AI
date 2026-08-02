import json
from typing import List, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RepoMind AI API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://repomind-ai-ten.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v) -> list:
        """
        Accepts CORS_ORIGINS as a JSON array string, a comma-separated string, or
        an actual list (for programmatic/test usage). This allows production deployments
        (Render + Vercel) to override the localhost default via a single env var.
        """
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                try:
                    return json.loads(stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return v


    # Supabase Settings
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AI Provider API Keys
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_API_KEY_2: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None  # P1-6: HuggingFace provider key

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()
