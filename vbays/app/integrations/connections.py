"""Saved logins (tokens) for Instagram, Google and LinkedIn, stored encrypted."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core import secrets
from app.core.models import Connection


class NotConnected(Exception):
    pass


def get(db: Session, platform: str) -> Connection | None:
    return db.get(Connection, platform)


def save(
    db: Session,
    platform: str,
    token: str,
    refresh_token: str | None = None,
    expires_at: datetime | None = None,
    account_id: str | None = None,
    account_name: str | None = None,
    scopes: str | None = None,
    extra: dict | None = None,
    user_id: int | None = None,
) -> Connection:
    c = db.get(Connection, platform) or Connection(platform=platform)
    c.token_enc = secrets.encrypt(token)
    if refresh_token:
        c.refresh_token_enc = secrets.encrypt(refresh_token)
    c.expires_at = expires_at
    c.account_id = account_id or c.account_id
    c.account_name = account_name or c.account_name
    c.scopes = scopes or c.scopes
    c.extra = {**(c.extra or {}), **(extra or {})}
    c.status, c.last_error = "connected", None
    c.connected_by_id = user_id or c.connected_by_id
    db.add(c)
    db.flush()
    return c


def token(db: Session, platform: str) -> tuple[Connection, str]:
    c = db.get(Connection, platform)
    tok = secrets.decrypt(c.token_enc) if c else None
    if not c or not tok:
        raise NotConnected(f"{platform} is not connected. Open Marketing → Connections.")
    return c, tok


def mark_error(db: Session, platform: str, error: str) -> None:
    c = db.get(Connection, platform)
    if c:
        c.status, c.last_error = "error", error[:1000]


def expired(c: Connection, margin_seconds: int = 120) -> bool:
    if not c.expires_at:
        return False
    exp = c.expires_at if c.expires_at.tzinfo else c.expires_at.replace(tzinfo=timezone.utc)
    return (exp - datetime.now(timezone.utc)).total_seconds() < margin_seconds


def disconnect(db: Session, platform: str) -> None:
    c = db.get(Connection, platform)
    if c:
        db.delete(c)
