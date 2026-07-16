"""
Clerk owns sign-up, sign-in, and session management entirely on the
frontend -- there is nothing to build here for those. The one thing worth
exposing is a `/me` endpoint: it forces a Clerk-token verification and
returns the local, backend-synced view of the user, which is the simplest
way to confirm the integration is wired correctly end to end.
"""
from fastapi import APIRouter, Depends

from app.models import User
from app.schemas import UserOut
from app.security import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
