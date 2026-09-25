"""Telegram bot for staff and the owner (free).

What works in Phase 1:
  /start CODE  or  /link CODE  – connect your Telegram to your Vbays login
  /me          – who am I
  /pending     – approvals waiting for you (with buttons)
  /help
  Approve / Reject / Needs-changes buttons on approval messages.

Sending uses the plain Telegram Bot API over HTTPS. Receiving uses
python-telegram-bot in "polling" mode, so no public web address is needed.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import approvals, audit, outbox
from app.core.db import session_scope
from app.core.models import Approval, User
from app.core.permissions import ROLES, can_decide_approval

log = logging.getLogger(__name__)
API = "https://api.telegram.org/bot{token}/{method}"
LINK_CODE_MINUTES = 30


# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------


def _call(method: str, data: dict) -> dict:
    token = get_settings().telegram_bot_token
    r = httpx.post(API.format(token=token, method=method), json=data, timeout=20)
    body = r.json()
    if not body.get("ok"):
        raise RuntimeError(f"Telegram error: {body.get('description')}")
    return body["result"]


def send_message(chat_id: str, text: str, payload: dict | None = None) -> dict:
    payload = payload or {}
    if payload.get("photo_path"):  # picture with a short caption
        import json

        data = {"chat_id": chat_id, "caption": text[:1024]}
        if payload.get("reply_markup"):
            data["reply_markup"] = json.dumps(payload["reply_markup"])
        token = get_settings().telegram_bot_token
        with open(payload["photo_path"], "rb") as f:
            r = httpx.post(API.format(token=token, method="sendPhoto"), data=data, files={"photo": f}, timeout=60)
        body = r.json()
        if not body.get("ok"):
            raise RuntimeError(f"Telegram error: {body.get('description')}")
        return {"message_id": body["result"].get("message_id")}
    data = {"chat_id": chat_id, "text": text[:4096]}
    if payload.get("reply_markup"):
        data["reply_markup"] = payload["reply_markup"]
    result = _call("sendMessage", data)
    return {"message_id": result.get("message_id")}


def register() -> None:
    if get_settings().telegram_bot_token:
        outbox.register_sender("telegram", send_message)


# ---------------------------------------------------------------------------
# Business logic (kept separate from Telegram so it can be tested)
# ---------------------------------------------------------------------------


def new_link_code(db: Session, user: User) -> str:
    code = f"{secrets.randbelow(10**6):06d}"
    user.telegram_link_code = code
    user.telegram_link_expires = datetime.now(timezone.utc) + timedelta(minutes=LINK_CODE_MINUTES)
    return code


def link_account(db: Session, chat_id: int, code: str, username: str | None) -> str:
    code = (code or "").strip()
    if not code:
        return "Welcome to Vbays! Ask the owner for your 6-digit link code, then send:  /link 123456"
    user = db.scalar(select(User).where(User.telegram_link_code == code))
    now = datetime.now(timezone.utc)
    if not user or not user.telegram_link_expires or user.telegram_link_expires < now:
        return "That code is wrong or expired. Ask the owner for a new code."
    other = db.scalar(select(User).where(User.telegram_chat_id == chat_id, User.id != user.id))
    if other:
        other.telegram_chat_id = None
    user.telegram_chat_id = chat_id
    user.telegram_username = username or user.telegram_username
    user.telegram_link_code = None
    user.telegram_link_expires = None
    audit.log(db, "telegram.linked", user, "user", user.id, {"chat_id": chat_id}, channel="telegram")
    return f"✅ Connected! Hello {user.name} ({ROLES.get(user.role, user.role)}). Send /help to see what I can do."


def user_for_chat(db: Session, chat_id: int) -> User | None:
    return db.scalar(select(User).where(User.telegram_chat_id == chat_id, User.is_active.is_(True)))


def pending_for(db: Session, user: User) -> list[Approval]:
    items = db.scalars(select(Approval).where(Approval.status == "pending").order_by(Approval.created_at))
    return [a for a in items if can_decide_approval(user.role, a.approver_role)]


def decide_from_callback(db: Session, chat_id: int, data: str) -> str:
    try:
        prefix, approval_id, decision = data.split(":")
        assert prefix == "apv"
        approval_id = int(approval_id)
    except (ValueError, AssertionError):
        return "Sorry, I didn't understand that button."
    user = user_for_chat(db, chat_id)
    if not user:
        return "Your Telegram is not linked to Vbays. Send /link CODE first."
    try:
        a = approvals.decide(db, approval_id, user, decision, note="via Telegram", channel="telegram")
    except approvals.ApprovalError as exc:
        return f"#{approval_id}: {exc}"
    return f"#{a.id} {a.title}\n→ {a.status.replace('_', ' ').upper()} by {user.name}"


HELP = (
    "Vbays bot commands:\n"
    "/pending – approvals waiting for you\n"
    "/me – your account\n"
    "/link CODE – connect this Telegram to your Vbays login\n"
    "More commands arrive with each new module."
)


# ---------------------------------------------------------------------------
# Receiving (python-telegram-bot)
# ---------------------------------------------------------------------------

_application = None

# Modules add their own Telegram commands here: functions that receive the
# python-telegram-bot Application and call app.add_handler(...)
HANDLER_HOOKS: list = []


def build_application():
    from telegram import InlineKeyboardMarkup, Update
    from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes

    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
        code = context.args[0] if context.args else ""
        with session_scope() as db:
            chat = update.effective_chat.id
            if not code and user_for_chat(db, chat):
                text = HELP
            else:
                text = link_account(db, chat, code, update.effective_user.username)
        await update.message.reply_text(text)

    async def me(update: Update, context: ContextTypes.DEFAULT_TYPE):
        with session_scope() as db:
            u = user_for_chat(db, update.effective_chat.id)
            text = f"{u.name} – {ROLES.get(u.role, u.role)}" if u else "Not linked. Send /link CODE."
        await update.message.reply_text(text)

    async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(HELP)

    async def pending(update: Update, context: ContextTypes.DEFAULT_TYPE):
        with session_scope() as db:
            u = user_for_chat(db, update.effective_chat.id)
            if not u:
                await update.message.reply_text("Not linked. Send /link CODE.")
                return
            items = [(approvals.format_for_telegram(a), approvals.telegram_buttons(a.id)) for a in pending_for(db, u)]
        if not items:
            await update.message.reply_text("Nothing waiting for you. 👍")
        for text, buttons in items[:10]:
            await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup.de_json(buttons, None))

    async def on_button(update: Update, context: ContextTypes.DEFAULT_TYPE):
        q = update.callback_query
        await q.answer()
        with session_scope() as db:
            result = decide_from_callback(db, q.message.chat.id, q.data or "")
        await q.edit_message_text(f"{q.message.text}\n\n{result}")

    app = Application.builder().token(get_settings().telegram_bot_token).build()
    app.add_handler(CommandHandler(["start", "link"], start))
    app.add_handler(CommandHandler("me", me))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("pending", pending))
    app.add_handler(CallbackQueryHandler(on_button, pattern=r"^apv:"))
    for hook in HANDLER_HOOKS:
        hook(app)
    return app


async def start_polling() -> None:
    global _application
    s = get_settings()
    if not (s.telegram_enabled and s.telegram_bot_token):
        log.info("Telegram bot is off (set TELEGRAM_ENABLED=true and TELEGRAM_BOT_TOKEN)")
        return
    _application = build_application()
    await _application.initialize()
    await _application.start()
    await _application.updater.start_polling(drop_pending_updates=True)
    log.info("Telegram bot started")


async def stop_polling() -> None:
    if _application:
        await _application.updater.stop()
        await _application.stop()
        await _application.shutdown()
