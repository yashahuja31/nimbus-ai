from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    email: Optional[str]

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class PlanStepOut(BaseModel):
    id: str
    operation: str
    params_json: str
    status: str

    class Config:
        from_attributes = True


class PlanOut(BaseModel):
    id: str
    request_text: str
    summary: Optional[str]
    terraform_hcl: Optional[str]
    risk_level: str
    estimated_monthly_cost_usd: str
    status: str
    created_at: datetime
    steps: List[PlanStepOut] = []

    class Config:
        from_attributes = True


class ExecutionLogOut(BaseModel):
    id: str
    plan_id: str
    step_id: Optional[str]
    level: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class CloudAccountCreate(BaseModel):
    provider: str = "aws"
    label: str = "default"
    region: str = "us-east-1"


class CloudAccountOut(BaseModel):
    id: str
    provider: str
    label: str
    region: str
    connected: bool

    class Config:
        from_attributes = True
