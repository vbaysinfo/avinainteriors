"""Marketing pages in the admin website."""
import secrets
import tempfile
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import approvals, audit, outbox
from app.core.auth import require
from app.core.db import get_db
from app.core.models import Lead, LeadActivity, ModuleSwitch, Setting, User
from app.integrations import connections, google, instagram, linkedin
from app.modules.m01_marketing import analytics, engagement, media, planner, publisher
from app.modules.m01_marketing.jobs import media_inbox
from app.modules.m01_marketing.models import ContentItem, MediaAsset, SocialComment, SocialPost
from app.web.common import check_csrf, flash, redirect, render

router = APIRouter()
CSRF = [Depends(check_csrf)]
VIEW, MANAGE = require("marketing.view"), require("marketing.manage")


def _ip(request: Request):
    return request.client.host if request.client else None


def _module(db: Session) -> ModuleSwitch | None:
    return db.get(ModuleSwitch, "M01")


# ---------------------------------------------------------------------------
# Public media links for Instagram (no login; signed and time-limited)
# ---------------------------------------------------------------------------


@router.get("/m/{token}")
def public_media(token: str):
    path = publisher.resolve_public(token)
    if not path:
        raise HTTPException(404)
    return FileResponse(path)


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------


@router.get("/marketing")
def overview(request: Request, week: str | None = None, user: User = Depends(VIEW), db: Session = Depends(get_db)):
    start = date.fromisoformat(week) if week else planner.week_start_for(date.today())
    items = list(db.scalars(select(ContentItem).where(ContentItem.week_start == start)
                            .order_by(ContentItem.scheduled_at)))
    posts: dict[int, list[SocialPost]] = {}
    for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id.in_([i.id for i in items] or [0]))):
        posts.setdefault(p.content_item_id, []).append(p)
    week_ago = datetime.now() - timedelta(days=7)
    stats = {
        "media_ok": db.scalar(select(func.count()).select_from(MediaAsset).where(MediaAsset.status == "ok")),
        "media_rejected": db.scalar(select(func.count()).select_from(MediaAsset).where(MediaAsset.status == "rejected")),
        "leads_week": db.scalar(select(func.count()).select_from(Lead).where(Lead.created_at >= week_ago)),
        "handover": db.scalar(select(func.count()).select_from(SocialComment)
                              .where(SocialComment.reply_status == "handover")),
        "awaiting": db.scalar(select(func.count()).select_from(SocialPost)
                              .where(SocialPost.status == "awaiting_approval")),
    }
    conns = {p: connections.get(db, p) for p in ("instagram", "google", "linkedin")}
    return render(request, "marketing/overview.html", user, items=items, posts=posts, week=start,
                  prev_week=start - timedelta(days=7), next_week=start + timedelta(days=7), stats=stats,
                  conns=conns, module=_module(db), paused=publisher.paused(db), tz=planner.tz(),
                  test_mode=outbox.is_test_mode(db, "M01"), policies={
                      p: planner.setting(db, f"platform_policy_{p}", "") for p in ("instagram", "youtube", "linkedin")})


ACTIONS = {
    "plan_now": ("Planned this week", lambda db: f"{len(planner.plan_week(db, planner.week_start_for(date.today())))} items"),
    "plan_next": ("Planned next week", lambda db: f"{len(planner.plan_week(db, planner.week_start_for(date.today()) + timedelta(days=7)))} items"),
    "produce_now": ("Production", lambda db: publisher.produce_due(db, hours_ahead=24 * 8, limit=3)),
    "publish_now": ("Publishing", publisher.publish_due),
    "poll_now": ("Comments & DMs", engagement.poll),
    "scan_media": ("Media inbox", media_inbox),
    "report_now": ("Weekly report sent to Telegram", lambda db: analytics.weekly_report(db)[:80]),
}


@router.post("/marketing/action", dependencies=CSRF)
def action(request: Request, what: str = Form(...), user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    if what in ("pause", "resume"):
        s = db.get(Setting, "marketing_paused")
        s.value = "yes" if what == "pause" else "no"
        audit.log(db, f"marketing.{what}", user, ip=_ip(request))
        flash(request, "Automatic posting paused." if what == "pause" else "Automatic posting resumed.")
        return redirect("/marketing")
    if what not in ACTIONS:
        raise HTTPException(400)
    label, fn = ACTIONS[what]
    try:
        result = fn(db)
        audit.log(db, f"marketing.{what}", user, details={"result": str(result)[:200]}, ip=_ip(request))
        flash(request, f"{label}: {result}")
    except Exception as exc:
        db.rollback()
        flash(request, f"{label} failed: {exc}", "error")
    return redirect("/marketing")


# ---------------------------------------------------------------------------
# One content item
# ---------------------------------------------------------------------------


@router.get("/marketing/item/{item_id}")
def item_page(request: Request, item_id: int, user: User = Depends(VIEW), db: Session = Depends(get_db)):
    item = db.get(ContentItem, item_id)
    if not item:
        raise HTTPException(404)
    posts = list(db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)))
    media_list = list(db.scalars(select(MediaAsset).where(MediaAsset.id.in_(item.media_ids or [0]))))
    return render(request, "marketing/item.html", user, item=item, posts=posts, media=media_list, tz=planner.tz())


@router.get("/marketing/file/{item_id}/{kind}")
def item_file(item_id: int, kind: str, n: int = 0, user: User = Depends(VIEW), db: Session = Depends(get_db)):
    item = db.get(ContentItem, item_id)
    if not item:
        raise HTTPException(404)
    rel = {"video": item.video_path, "landscape": item.video_landscape_path, "thumb": item.thumbnail_path,
           "srt": item.subtitles_path,
           "slide": (item.image_paths or [None])[n] if 0 <= n < len(item.image_paths or []) else None}.get(kind)
    path = publisher.storage(rel)
    if not path or not path.exists():
        raise HTTPException(404)
    return FileResponse(path)


@router.post("/marketing/item/{item_id}", dependencies=CSRF)
def item_action(request: Request, item_id: int, what: str = Form(...), when: str = Form(""),
                user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    item = db.get(ContentItem, item_id)
    if not item:
        raise HTTPException(404)
    posts = list(db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)))
    if what == "approve":
        for p in posts:
            if p.status == "awaiting_approval" and p.approval_id:
                try:
                    approvals.decide(db, p.approval_id, user, "approve", channel="web")
                except approvals.ApprovalError as exc:
                    flash(request, str(exc), "error")
        flash(request, "Approved. It will post at its scheduled time.")
    elif what == "regenerate":
        item.package, item.check, item.status, item.error = None, None, "planned", "Regenerate requested"
        for p in posts:
            if p.status in ("awaiting_approval", "scheduled", "failed"):
                p.status, p.attempts = "waiting", 0
        publisher.produce(db, item)
        flash(request, "Made a new version.")
    elif what == "reject":
        for p in posts:
            if p.status in ("waiting", "awaiting_approval", "scheduled", "failed"):
                p.status = "rejected"
        item.status = "rejected"
        flash(request, "Rejected. It will not be posted.")
    elif what == "reschedule":
        try:
            new = datetime.fromisoformat(when).replace(tzinfo=planner.tz())
        except ValueError:
            flash(request, "Pick a date and time.", "error")
            return redirect(f"/marketing/item/{item_id}")
        item.scheduled_at = new
        for p in posts:
            if p.status in ("waiting", "awaiting_approval", "scheduled"):
                p.scheduled_at = new
        flash(request, f"Moved to {new.strftime('%a %d %b %H:%M')}.")
    elif what == "produce":
        publisher.produce(db, item)
        flash(request, "Content made.")
    elif what == "publish_now":
        for p in posts:
            if p.status == "scheduled":
                publisher.publish_one(db, p)
        flash(request, "Published (or recorded in the Outbox in test mode).")
    else:
        raise HTTPException(400)
    audit.log(db, f"marketing.item_{what}", user, "content_item", item_id, ip=_ip(request))
    return redirect(f"/marketing/item/{item_id}")


# ---------------------------------------------------------------------------
# Media library
# ---------------------------------------------------------------------------


@router.get("/marketing/media")
def media_page(request: Request, status: str = "ok", user: User = Depends(VIEW), db: Session = Depends(get_db)):
    q = select(MediaAsset).order_by(MediaAsset.id.desc()).limit(300)
    if status != "all":
        q = q.where(MediaAsset.status == status)
    return render(request, "marketing/media.html", user, assets=list(db.scalars(q)), status=status)


@router.get("/marketing/media/file/{asset_id}")
def media_file(asset_id: int, user: User = Depends(VIEW), db: Session = Depends(get_db)):
    a = db.get(MediaAsset, asset_id)
    if not a or not media.abs_path(a).exists():
        raise HTTPException(404)
    return FileResponse(media.abs_path(a))


@router.post("/marketing/media/upload", dependencies=CSRF)
async def media_upload(request: Request, files: list[UploadFile], project: str = Form(""),
                       user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    added = rejected = 0
    for f in files:
        if not media.kind_for(f.filename or "", f.content_type):
            continue
        tmp = Path(tempfile.mkdtemp()) / Path(f.filename).name
        tmp.write_bytes(await f.read())
        asset = media.ingest(db, "upload", f"{secrets.token_hex(8)}-{f.filename}", tmp, Path(f.filename).name,
                             project=project or None, uploaded_by_id=user.id)
        if asset:
            media.check_asset(db, asset)
            added += asset.status == "ok"
            rejected += asset.status == "rejected"
    audit.log(db, "marketing.media_upload", user, details={"ok": added, "rejected": rejected}, ip=_ip(request))
    flash(request, f"Uploaded: {added} usable, {rejected} rejected.")
    return redirect("/marketing/media?status=all")


@router.post("/marketing/media/{asset_id}", dependencies=CSRF)
def media_action(request: Request, asset_id: int, what: str = Form(...), user: User = Depends(MANAGE),
                 db: Session = Depends(get_db)):
    a = db.get(MediaAsset, asset_id)
    if not a:
        raise HTTPException(404)
    if what == "consent":
        a.consent_ok = not a.consent_ok
    elif what == "reject":
        a.status, a.reject_reason = "rejected", f"Rejected by {user.name}"
    elif what == "restore":
        a.status, a.reject_reason = "ok", None
    else:
        raise HTTPException(400)
    audit.log(db, f"marketing.media_{what}", user, "media", asset_id, ip=_ip(request))
    return redirect(request.headers.get("referer") or "/marketing/media")


# ---------------------------------------------------------------------------
# Leads & comments
# ---------------------------------------------------------------------------


@router.get("/marketing/leads")
def leads_page(request: Request, user: User = Depends(VIEW), db: Session = Depends(get_db)):
    leads = list(db.scalars(select(Lead).order_by(Lead.id.desc()).limit(200)))
    comments = list(db.scalars(select(SocialComment).order_by(SocialComment.id.desc()).limit(200)))
    by_source = db.execute(select(Lead.source, func.count()).group_by(Lead.source)).all()
    return render(request, "marketing/leads.html", user, leads=leads, comments=comments, by_source=by_source,
                  test_mode=outbox.is_test_mode(db, "M01"))


@router.post("/marketing/comment/{cid}/reply", dependencies=CSRF)
def comment_reply(request: Request, cid: int, text: str = Form(...), user: User = Depends(MANAGE),
                  db: Session = Depends(get_db)):
    c = db.get(SocialComment, cid)
    if not c or not text.strip():
        raise HTTPException(400)
    engagement._send_reply(db, c, text.strip())
    if c.lead_id:
        db.add(LeadActivity(lead_id=c.lead_id, kind="reply", text=text.strip(), by_user_id=user.id))
    audit.log(db, "marketing.manual_reply", user, "comment", cid, ip=_ip(request))
    flash(request, f"Reply {c.reply_status}.")
    return redirect("/marketing/leads")


@router.post("/marketing/simulate", dependencies=CSRF)
def simulate(request: Request, text: str = Form(...), platform: str = Form("instagram"),
             user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    if not outbox.is_test_mode(db, "M01"):
        raise HTTPException(400, "Simulated comments are only allowed in test mode.")
    c = engagement.simulate(db, text, platform if platform in ("instagram", "youtube") else "instagram")
    flash(request, f"Test comment handled: {c.intent}, lead={'yes' if c.is_lead else 'no'}, reply={c.reply_status}.")
    return redirect("/marketing/leads")


# ---------------------------------------------------------------------------
# Connections
# ---------------------------------------------------------------------------


@router.get("/marketing/connections")
def connections_page(request: Request, user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    s = get_settings()
    return render(request, "marketing/connections.html", user,
                  conns={p: connections.get(db, p) for p in ("instagram", "google", "linkedin")},
                  google_ready=bool(s.google_client_id and s.google_client_secret),
                  linkedin_ready=bool(s.linkedin_client_id and s.linkedin_client_secret),
                  google_redirect=google.redirect_uri(), linkedin_redirect=linkedin.redirect_uri(),
                  public_ok=s.base_url.startswith("https://"))


@router.post("/marketing/connect/instagram", dependencies=CSRF)
def connect_instagram(request: Request, token: str = Form(...), user: User = Depends(MANAGE),
                      db: Session = Depends(get_db)):
    try:
        c = instagram.connect_with_token(db, token.strip(), user.id)
        audit.log(db, "connection.instagram", user, details={"account": c.account_name}, ip=_ip(request))
        flash(request, f"Instagram connected: {c.account_name}")
    except Exception as exc:
        flash(request, f"Instagram did not accept that token: {exc}", "error")
    return redirect("/marketing/connections")


def _start_oauth(request: Request, platform: str, url_fn) -> RedirectResponse:
    state = secrets.token_urlsafe(24)
    request.session[f"oauth_{platform}"] = state
    return RedirectResponse(url_fn(state), status_code=303)


def _finish_oauth(request: Request, platform: str, code: str | None, state: str | None, error: str | None,
                  finish_fn, user: User, db: Session):
    expected = request.session.pop(f"oauth_{platform}", None)
    if error or not code:
        flash(request, f"{platform.title()} connection cancelled: {error or 'no code'}", "error")
    elif not expected or not secrets.compare_digest(expected, state or ""):
        flash(request, "Security check failed, please try again.", "error")
    else:
        try:
            c = finish_fn(db, code, user.id)
            audit.log(db, f"connection.{platform}", user, details={"account": c.account_name}, ip=_ip(request))
            flash(request, f"{platform.title()} connected: {c.account_name}")
        except Exception as exc:
            flash(request, f"{platform.title()} connection failed: {exc}", "error")
    return redirect("/marketing/connections")


@router.get("/marketing/connect/google/start")
def google_start(request: Request, user: User = Depends(MANAGE)):
    return _start_oauth(request, "google", google.auth_url)


@router.get("/marketing/connect/google/callback")
def google_callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None,
                    user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    return _finish_oauth(request, "google", code, state, error, google.finish_auth, user, db)


@router.get("/marketing/connect/linkedin/start")
def linkedin_start(request: Request, user: User = Depends(MANAGE)):
    return _start_oauth(request, "linkedin", linkedin.auth_url)


@router.get("/marketing/connect/linkedin/callback")
def linkedin_callback(request: Request, code: str | None = None, state: str | None = None,
                      error: str | None = None, user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    return _finish_oauth(request, "linkedin", code, state, error, linkedin.finish_auth, user, db)


@router.post("/marketing/disconnect/{platform}", dependencies=CSRF)
def disconnect(request: Request, platform: str, user: User = Depends(MANAGE), db: Session = Depends(get_db)):
    if platform not in ("instagram", "google", "linkedin"):
        raise HTTPException(404)
    connections.disconnect(db, platform)
    audit.log(db, f"connection.{platform}_removed", user, ip=_ip(request))
    flash(request, f"{platform.title()} disconnected.")
    return redirect("/marketing/connections")
