"""The approval engine: nothing goes out without a human "yes".

How a module uses it:
    approvals.register_handler("quotation", on_approved=send_quote, on_rejected=...)
    approvals.request(db, kind="quotation", title="Quote Q-12 for Mr. Rao", ...)

The right people get a Telegram message with Approve / Reject / Changes
buttons (and see it in the admin website). When someone decides, the
module's handler runs and the decision is written to the audit log.
"""
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import audit, outbox
from app.core.models import Approval, Notification, User
from app.core.permissions import can_decide_approval

DECISIONS = {"approve": "approved", "reject": "rejected", "changes": "changes_requested"}

Handler = Callable[[Session, Approval, User], None]


@dataclass
class _Handlers:
    on_approved: Handler | None = None
    on_rejected: Handler | None = None
    on_changes: Handler | None = None


_HANDLERS: dict[str, _Handlers] = {}


def register_handler(kind: str, on_approved=None, on_rejected=None, on_changes=None) -> None:
    _HANDLERS[kind] = _Handlers(on_approved, on_rejected, on_changes)


class ApprovalError(Exception):
    pass


def approvers_for(db: Session, role: str) -> list[User]:
    roles = {role, "owner"}
    return list(db.scalars(select(User).where(User.role.in_(roles), User.is_active.is_(True))))


def telegram_buttons(approval_id: int) -> dict:
    return {
        "inline_keyboard": [
            [
                {"text": "✅ Approve", "callback_data": f"apv:{approval_id}:approve"},
                {"text": "❌ Reject", "callback_data": f"apv:{approval_id}:reject"},
            ],
            [{"text": "✏️ Needs changes", "callback_data": f"apv:{approval_id}:changes"}],
        ]
    }


def format_for_telegram(a: Approval) -> str:
    return f"🔔 Approval needed #{a.id} ({a.kind})\n\n{a.title}\n\n{a.summary}".strip()


def request(
    db: Session,
    kind: str,
    title: str,
    summary: str = "",
    payload: dict | None = None,
    approver_role: str = "owner",
    requested_by: User | None = None,
    entity_type: str | None = None,
    entity_id: object = None,
    channel: str = "system",
) -> Approval:
    a = Approval(
        kind=kind,
        title=title,
        summary=summary,
        payload=payload,
        approver_role=approver_role,
        requested_by_id=requested_by.id if requested_by else None,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        status="pending",
    )
    db.add(a)
    db.flush()
    audit.log(db, "approval.requested", requested_by, "approval", a.id, {"kind": kind, "title": title}, channel)

    sent = []
    for u in approvers_for(db, approver_role):
        db.add(Notification(user_id=u.id, text=f"Approval needed: {title}"))
        if u.telegram_chat_id:
            msg = outbox.send(
                db,
                "telegram",
                str(u.telegram_chat_id),
                format_for_telegram(a),
                audience="staff",
                payload={"reply_markup": telegram_buttons(a.id)},
            )
            result = (msg.payload or {}).get("result") or {}
            if result.get("message_id"):
                sent.append([u.telegram_chat_id, result["message_id"]])
    a.telegram_messages = sent
    return a


def decide(
    db: Session,
    approval_id: int,
    user: User,
    decision: str,
    note: str | None = None,
    channel: str = "web",
) -> Approval:
    if decision not in DECISIONS:
        raise ApprovalError(f"Unknown decision: {decision}")
    a = db.get(Approval, approval_id, with_for_update=True)
    if a is None:
        raise ApprovalError("Approval not found.")
    if a.status != "pending":
        raise ApprovalError(f"Already {a.status.replace('_', ' ')}.")
    if not can_decide_approval(user.role, a.approver_role):
        raise ApprovalError("Your role cannot decide this item.")

    a.status = DECISIONS[decision]
    a.decided_by_id = user.id
    a.decided_at = datetime.now(timezone.utc)
    a.decision_note = note
    audit.log(db, f"approval.{a.status}", user, "approval", a.id, {"kind": a.kind, "note": note}, channel)

    h = _HANDLERS.get(a.kind)
    if h:
        fn = {"approved": h.on_approved, "rejected": h.on_rejected, "changes_requested": h.on_changes}[a.status]
        if fn:
            fn(db, a, user)

    if a.requested_by_id and a.requested_by_id != user.id:
        db.add(Notification(user_id=a.requested_by_id, text=f"{a.title}: {a.status.replace('_', ' ')} by {user.name}"))
    db.flush()
    return a


# A harmless approval type used to test the whole flow end to end.
def _test_approved(db: Session, a: Approval, user: User) -> None:
    outbox.send(
        db,
        "whatsapp",
        "+910000000000",
        f"[TEST] This message would go to a customer after approval #{a.id}.",
        audience="customer",
        approval_id=a.id,
    )


register_handler("test", on_approved=_test_approved)
