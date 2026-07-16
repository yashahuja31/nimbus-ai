from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "Nimbus AI"
    environment: str = "development"

    # Auth: Clerk issues and manages sessions entirely (email/password,
    # Google, GitHub, etc. are all configured in the Clerk dashboard, not
    # here). The backend's only job is to verify the session token Clerk
    # hands the frontend. Find these in Clerk Dashboard -> Configure -> API
    # Keys -> Show JWKS URL / Issuer.
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""

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

    # Scaling knobs
    chat_rate_limit: str = "10/minute"  # per client, on the LLM-calling endpoint
    default_page_size: int = 50
    max_page_size: int = 200

    # Comma-separated list of allowed frontend origins in production, e.g.
    # "https://app.nimbus.ai,https://nimbus.ai". Defaults wide open for
    # local dev only -- DEPLOYMENT.md walks through tightening this.
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
