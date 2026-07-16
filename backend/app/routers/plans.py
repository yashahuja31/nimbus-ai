from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.config import settings
from app.database import get_db
from app.models import Plan, PlanStatus, User
from app.schemas import PlanOut
from app.security import get_current_user

router = APIRouter(prefix="/plans", tags=["plans"])


def _get_owned_plan(plan_id: str, db: Session, user: User) -> Plan:
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.owner_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.get("", response_model=list[PlanOut])
def list_plans(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(settings.default_page_size, ge=1, le=settings.max_page_size),
):
    return (
        db.query(Plan)
        .filter(Plan.owner_id == user.id)
        .order_by(Plan.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_owned_plan(plan_id, db, user)


@router.post("/{plan_id}/approve", response_model=PlanOut)
def approve_plan(plan_id: str, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    plan = _get_owned_plan(plan_id, db, user)
    if plan.status != PlanStatus.proposed:
        raise HTTPException(status_code=400, detail=f"Plan is already {plan.status.value}")

    plan.status = PlanStatus.executing
    for step in plan.steps:
        step.status = PlanStatus.executing
    db.commit()

    # Hand off to the Task Queue -> Execution Engine. This is the one line
    # in the whole system that turns "the AI wants to do X" into "X is
    # actually happening" -- and it only runs after this endpoint has been
    # hit, i.e. after a human clicked Approve.
    for step in plan.steps:
        celery_app.send_task("execute_plan_step", args=[step.id])

    db.refresh(plan)
    return plan


@router.post("/{plan_id}/reject", response_model=PlanOut)
def reject_plan(plan_id: str, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    plan = _get_owned_plan(plan_id, db, user)
    if plan.status != PlanStatus.proposed:
        raise HTTPException(status_code=400, detail=f"Plan is already {plan.status.value}")
    plan.status = PlanStatus.rejected
    for step in plan.steps:
        step.status = PlanStatus.rejected
    db.commit()
    db.refresh(plan)
    return plan
