from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    assemblyai_api_key: str = ""
    llm_provider: str = "anthropic"
    llm_model: str = "deepseek-flash"
    llm_base_url: str | None = None
    llm_api_key: str = ""
    tavily_api_key: str = ""
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
