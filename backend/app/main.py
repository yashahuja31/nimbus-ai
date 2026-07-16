from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.rate_limit import limiter
from app.routers import auth, aws_accounts, chat, history, plans


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP-simple schema bootstrap. Swap for Alembic migrations (see
    # docs/SCALING.md) once this is more than a single-node deployment.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Nimbus AI", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(plans.router)
app.include_router(aws_accounts.router)
app.include_router(history.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "nimbus-ai-backend"}
