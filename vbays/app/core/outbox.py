"""Every outgoing message goes through here.

Rules enforced in one place:
1. Messages to CUSTOMERS or the PUBLIC need an approval (or an approved
   template/policy, passed as approved=True). Otherwise they are BLOCKED.
2. In TEST MODE, customer/public messages are only recorded (status "test"),
   never sent. Staff messages on Telegram still go out so you can test
   approvals on your phone.
3. Every message is saved, so the Outbox screen shows exactly what was (or
   would have been) sent.
"""
import logging
from collections.abc import Callable
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.models import ModuleSwitch, OutboxMessage

log = logging.getLogger(__name__)

# channel name -> function(recipient, body, payload) -> dict | None
# Integrations register themselves here (see app/integrations/*).
SENDERS: dict[str, Callable[[str, str, dict | None], dict | None]] = {}


def register_sender(channel: str, fn: Callable[[str, str, dict | None], dict | None]) -> None:
    SENDERS[channel] = fn


def is_test_mode(db: Session, module_code: str | None = None) -> bool:
    if get_settings().test_mode:
        return True
    if module_code:
        sw = db.get(ModuleSwitch, module_code)
        if sw and sw.test_mode:
            return True
    return False


def send(
    db: Session,
    channel: str,
    recipient: str,
    body: str,
    audience: str = "staff",
    payload: dict | None = None,
    approved: bool = False,
    approval_id: int | None = None,
    module_code: str | None = None,
    deliver: Callable[[], dict | None] | None = None,
) -> OutboxMessage:
    """Record and (unless blocked / test mode) send a message.

    deliver: optional function that does the real sending (e.g. post an
    Instagram comment reply). Otherwise the channel's registered sender is used.
    """
    test = is_test_mode(db, module_code)
    msg = OutboxMessage(
        channel=channel,
        recipient=str(recipient),
        body=body,
        payload=payload,
        audience=audience,
        approval_id=approval_id,
        test_mode=test,
    )
    db.add(msg)

    if audience in ("customer", "public") and not (approved or approval_id):
        msg.status = "blocked"
        msg.error = "Needs approval before it can go to a customer or the public."
    elif test and audience in ("customer", "public"):
        msg.status = "test"
    else:
        sender = (lambda r, b, p: deliver()) if deliver else SENDERS.get(channel)
        if sender is None:
            msg.status = "test"
            msg.error = f"No {channel} connection configured; message recorded only."
        else:
            try:
                result = sender(msg.recipient, body, payload)
                msg.status = "sent"
                msg.sent_at = datetime.now(timezone.utc)
                if result:
                    msg.payload = {**(payload or {}), "result": result}
            except Exception as exc:  # keep going; the failure is visible in the Outbox
                log.exception("Sending %s message failed", channel)
                msg.status = "failed"
                msg.error = str(exc)[:1000]
    db.flush()
    return msg
