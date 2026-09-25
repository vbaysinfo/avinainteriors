"""Staff login: password hashing, sessions, and permission checks for web pages."""
from datetime import datetime, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.models import User
from app.core.permissions import has_permission

_hasher = PasswordHasher()
MAX_FAILED_LOGINS = 5


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    if not password_hash:
        return False
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def authenticate(db: Session, login: str, password: str) -> User | None:
    """Log in with email or phone. Locks the account after 5 wrong passwords."""
    login = login.strip().lower()
    user = db.scalar(select(User).where((User.email == login) | (User.phone == login)))
    if not user or not user.is_active:
        return None
    if user.failed_logins >= MAX_FAILED_LOGINS:
        return None
    if not verify_password(user.password_hash, password):
        user.failed_logins += 1
        return None
    user.failed_logins = 0
    user.last_login_at = datetime.now(timezone.utc)
    return user


class LoginRequired(Exception):
    """Raised when a page needs a logged-in user; handled by redirecting to /login."""


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise LoginRequired()
    user = db.get(User, user_id)
    if not user or not user.is_active:
        request.session.clear()
        raise LoginRequired()
    return user


def require(permission: str):
    """Page dependency: user must be logged in and have `permission`."""

    def checker(user: User = Depends(current_user)) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(status_code=403, detail="Your role does not have access to this page.")
        return user

    return checker
