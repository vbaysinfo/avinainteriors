"""Marketing on Telegram.

- Staff send photos/videos of sites or the factory to the bot → they go into
  the media library, get checked, and are used in posts automatically.
  (Add a caption like "Rao villa kitchen after" to help.)
- /pause  and /resume  stop or restart automatic posting (owner/manager/marketing).
- /leads  shows the latest leads from social media.
"""
import tempfile
from pathlib import Path

from sqlalchemy import select

from app.core import audit
from app.core.db import session_scope
from app.core.models import Lead, Setting
from app.core.permissions import has_permission
from app.integrations.telegram_bot import user_for_chat
from app.modules.m01_marketing import media

MAX_BOT_DOWNLOAD = 20 * 1024 * 1024  # Telegram bots can download files up to 20 MB


def add_handlers(app) -> None:
    from telegram import Update
    from telegram.ext import CommandHandler, ContextTypes, MessageHandler, filters

    async def on_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
        msg = update.message
        with session_scope() as db:
            user = user_for_chat(db, update.effective_chat.id)
            if not user:
                await msg.reply_text("Please link your Telegram first: /link CODE")
                return
            uid = user.id
        if msg.photo:
            tg_file, name = msg.photo[-1], f"telegram_{msg.photo[-1].file_unique_id}.jpg"
        elif msg.video:
            tg_file, name = msg.video, msg.video.file_name or f"telegram_{msg.video.file_unique_id}.mp4"
        else:
            doc = msg.document
            if not doc or not media.kind_for(doc.file_name or "", doc.mime_type):
                return
            tg_file, name = doc, doc.file_name
        if (getattr(tg_file, "file_size", 0) or 0) > MAX_BOT_DOWNLOAD:
            await msg.reply_text("This file is over 20 MB, which Telegram doesn't allow bots to download. "
                                 "Please put it in the Google Drive folder instead.")
            return
        f = await tg_file.get_file()
        tmp = Path(tempfile.mkdtemp()) / name
        await f.download_to_drive(str(tmp))
        with session_scope() as db:
            asset = media.ingest(db, "telegram", tg_file.file_unique_id, tmp, name, project=msg.caption,
                                 uploaded_by_id=uid)
            if not asset:
                text = "Already in the library 👍"
            else:
                media.check_asset(db, asset)
                text = (f"✅ Added to media library (#{asset.id}): {asset.description or asset.room_type or ''}"
                        if asset.status == "ok" else f"⚠️ Not usable for posts: {asset.reject_reason}")
        await msg.reply_text(text)

    async def set_pause(update: Update, context: ContextTypes.DEFAULT_TYPE, value: str):
        with session_scope() as db:
            user = user_for_chat(db, update.effective_chat.id)
            if not user or not has_permission(user.role, "marketing.manage"):
                await update.message.reply_text("Only the owner, manager or marketing can do this.")
                return
            s = db.get(Setting, "marketing_paused")
            if s:
                s.value = value
            audit.log(db, "marketing.paused" if value == "yes" else "marketing.resumed", user, channel="telegram")
        await update.message.reply_text("⏸ Automatic posting paused." if value == "yes"
                                        else "▶️ Automatic posting resumed.")

    async def pause(update, context):
        await set_pause(update, context, "yes")

    async def resume(update, context):
        await set_pause(update, context, "no")

    async def leads(update: Update, context: ContextTypes.DEFAULT_TYPE):
        with session_scope() as db:
            user = user_for_chat(db, update.effective_chat.id)
            if not user or not has_permission(user.role, "marketing.view"):
                await update.message.reply_text("Not allowed.")
                return
            rows = list(db.scalars(select(Lead).order_by(Lead.id.desc()).limit(8)))
            text = "\n".join(f"#{ld.id} {ld.score.upper()} · {ld.source} · {ld.handle or ld.name or '-'} · "
                             f"{(ld.interest or '')[:50]}" for ld in rows) or "No leads yet."
        await update.message.reply_text("Latest leads:\n" + text)

    app.add_handler(MessageHandler(filters.PHOTO | filters.VIDEO | filters.Document.ALL, on_media))
    app.add_handler(CommandHandler("pause", pause))
    app.add_handler(CommandHandler("resume", resume))
    app.add_handler(CommandHandler("leads", leads))
