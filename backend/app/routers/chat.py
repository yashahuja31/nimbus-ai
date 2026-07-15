import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent.graph import run_planner
from app.database import get_db
from app.models import Plan, PlanStep, User
from app.schemas import ChatRequest, PlanOut
from app.security import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=PlanOut)
def chat(payload: ChatRequest, db: Session = Depends(get_db),
          user: User = Depends(get_current_user)):
    result = run_planner(payload.message)

    plan = Plan(
        owner_id=user.id,
        request_text=payload.message,
        summary=result.get("summary", ""),
        terraform_hcl=result.get("terraform_hcl", ""),
        risk_level=result.get("risk_level", "low"),
        estimated_monthly_cost_usd=f"{result.get('estimated_monthly_cost_usd', 0.0):.2f}",
    )
    db.add(plan)
    db.flush()

    for i, op in enumerate(result.get("operations", [])):
        db.add(PlanStep(
            plan_id=plan.id,
            order=str(i),
            operation=op["operation"],
            params_json=json.dumps(op["params"]),
        ))

    db.commit()
    db.refresh(plan)
    return plan
