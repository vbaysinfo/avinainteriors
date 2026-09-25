"""Audit trail: record every important action."""
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.models import AuditLog, User


def log(
    db: Session,
    action: str,
    user: User | None = None,
    entity_type: str | None = None,
    entity_id: object = None,
    details: dict | None = None,
    channel: str = "web",
    ip: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        at=datetime.now(timezone.utc),
        user_id=user.id if user else None,
        user_name=user.name if user else "system",
        channel=channel,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
        ip=ip,
    )
    db.add(entry)
    db.flush()
    return entry


# PostgreSQL trigger that makes the audit log insert-only.
PROTECT_AUDIT_SQL = """
CREATE OR REPLACE FUNCTION vbays_audit_readonly() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is insert-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_log_readonly ON audit_log;
CREATE TRIGGER audit_log_readonly BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION vbays_audit_readonly();
"""


def protect_audit_table(db: Session) -> None:
    if db.bind.dialect.name == "postgresql":
        db.execute(text(PROTECT_AUDIT_SQL))
