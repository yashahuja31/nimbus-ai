from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, aws_accounts, chat, history, plans

app = FastAPI(title="Nimbus AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(plans.router)
app.include_router(aws_accounts.router)
app.include_router(history.router)


@app.on_event("startup")
def on_startup():
    # MVP-simple schema bootstrap. Swap for Alembic migrations before this
    # is anything other than a single-node dev/demo deployment.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": "nimbus-ai-backend"}
