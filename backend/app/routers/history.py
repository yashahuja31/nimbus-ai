from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import ExecutionLog, Plan, User
from app.schemas import ExecutionLogOut
from app.security import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[ExecutionLogOut])
def list_logs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(settings.default_page_size, ge=1, le=settings.max_page_size),
):
    return (
        db.query(ExecutionLog)
        .join(Plan, Plan.id == ExecutionLog.plan_id)
        .filter(Plan.owner_id == user.id)
        .order_by(ExecutionLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
