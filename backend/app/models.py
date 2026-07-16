import enum
import uuid
from datetime import datetime

from sqlalchemy import (Boolean, Column, DateTime, Enum, ForeignKey, String,
                         Text)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    # Clerk's stable user id (the JWT's `sub` claim) -- this, not email, is
    # the real identity key. Email is best-effort, synced from the token
    # when present, and may be null.
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=False, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cloud_accounts = relationship("CloudAccount", back_populates="owner")
    plans = relationship("Plan", back_populates="owner")


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id = Column(String, primary_key=True, default=gen_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String, default="aws")
    label = Column(String, default="default")
    region = Column(String, default="us-east-1")
    # For the MVP, credentials live in env vars (see app/config.py) rather
    # than per-row plaintext secrets. This column records *that a connection
    # exists* and its metadata; wiring a real secrets manager is a Phase 9
    # (enterprise / security) concern, not an MVP one.
    connected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="cloud_accounts")


class PlanStatus(str, enum.Enum):
    proposed = "proposed"
    approved = "approved"
    rejected = "rejected"
    executing = "executing"
    completed = "completed"
    failed = "failed"


class Plan(Base):
    __tablename__ = "plans"

    id = Column(String, primary_key=True, default=gen_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    request_text = Column(Text, nullable=False)
    summary = Column(Text)
    terraform_hcl = Column(Text)
    risk_level = Column(String, default="low")
    estimated_monthly_cost_usd = Column(String, default="0.00")
    status = Column(Enum(PlanStatus), default=PlanStatus.proposed)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="plans")
    steps = relationship("PlanStep", back_populates="plan", order_by="PlanStep.order")


class PlanStep(Base):
    __tablename__ = "plan_steps"

    id = Column(String, primary_key=True, default=gen_uuid)
    plan_id = Column(String, ForeignKey("plans.id"), nullable=False, index=True)
    order = Column(String, default="0")
    operation = Column(String, nullable=False)  # e.g. s3.create_bucket
    params_json = Column(Text, default="{}")
    status = Column(Enum(PlanStatus), default=PlanStatus.proposed)

    plan = relationship("Plan", back_populates="steps")


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    plan_id = Column(String, ForeignKey("plans.id"), nullable=False, index=True)
    step_id = Column(String, ForeignKey("plan_steps.id"), nullable=True, index=True)
    level = Column(String, default="info")  # info | success | error
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
