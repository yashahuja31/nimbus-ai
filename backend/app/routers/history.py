from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ExecutionLog, Plan, User
from app.schemas import ExecutionLogOut
from app.security import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[ExecutionLogOut])
def list_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ExecutionLog)
        .join(Plan, Plan.id == ExecutionLog.plan_id)
        .filter(Plan.owner_id == user.id)
        .order_by(ExecutionLog.created_at.desc())
        .limit(200)
        .all()
    )
