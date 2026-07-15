from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "Nimbus AI"
    environment: str = "development"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # Data
    database_url: str = "postgresql://nimbus:nimbus@postgres:5432/nimbus"
    redis_url: str = "redis://redis:6379/0"

    # AI provider. Nimbus is written against Gemini (per the product spec) but
    # the LLM layer is swappable -- see app/agent/llm.py.
    google_api_key: str = ""
    llm_model: str = "gemini-2.5-pro"

    # AWS -- credentials for the *connected customer account* Nimbus operates
    # on. For the MVP these come from environment/DB, never hardcoded.
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # Safety: with dry_run on, the executor builds and validates the AWS
    # call but does not actually perform it. Flip only once you trust the
    # setup end-to-end -- this is the "never destructive without approval"
    # guardrail made concrete.
    dry_run: bool = True


settings = Settings()
