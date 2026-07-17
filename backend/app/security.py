"""
Auth is delegated entirely to Clerk. The frontend signs users in with
Clerk's hosted components (email/password, Google, GitHub -- whatever's
enabled in the Clerk dashboard) and attaches Clerk's session token to every
API request. This module's only job is to verify that token and map it to
a local User row -- it never sees a password.
"""
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User


@lru_cache
def _jwks_client() -> PyJWKClient:
    if not settings.clerk_jwks_url:
        raise RuntimeError(
            "CLERK_JWKS_URL is not set. Find it in Clerk Dashboard -> "
            "Configure -> API Keys -> Show JWKS URL, and add it to backend/.env."
        )
    return PyJWKClient(settings.clerk_jwks_url)


def _decode_clerk_token(token: str) -> dict:
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        options = {"verify_aud": False}  # Clerk session tokens don't set aud
        kwargs = {"issuer": settings.clerk_issuer} if settings.clerk_issuer else {}
        return jwt.decode(token, signing_key.key, algorithms=["RS256"], options=options, **kwargs)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid session token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header.removeprefix("Bearer ").strip()
    claims = _decode_clerk_token(token)

    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        # First time we've seen this Clerk user -- provision a local row.
        # `email` is only present if you've added it to your Clerk JWT
        # template (Dashboard -> Configure -> Sessions -> Customize
        # session token); it's optional, everything keys off clerk_user_id.
        user = User(clerk_user_id=clerk_user_id, email=claims.get("email"))
        db.add(user)
        db.commit()
        db.refresh(user)
    elif claims.get("email") and user.email != claims.get("email"):
        user.email = claims.get("email")
        db.commit()

    return user
