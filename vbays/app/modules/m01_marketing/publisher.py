"""Production and publishing.

produce()      package → video/images/thumbnail → schedule or ask approval
publish_due()  posts whose time has come → Instagram / YouTube / LinkedIn

Posting rules (Marketing settings):
  platform_policy_instagram = auto     → posts by itself
  platform_policy_youtube   = auto     → posts by itself
  platform_policy_linkedin  = approve  → owner taps ✅ on Telegram first
Even on "auto", a piece goes to the owner first if the AI was not
available, the fact check found a problem, or information was missing.
"""
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import approvals, audit, outbox
from app.core.models import Approval, User
from app.modules.m01_marketing import planner, video
from app.modules.m01_marketing.media import abs_path, mark_used
from app.modules.m01_marketing.models import ContentItem, MediaAsset, SocialPost

log = logging.getLogger(__name__)
MODULE = "M01"
MAX_ATTEMPTS = 3


# ---------------------------------------------------------------------------
# Public links for Instagram to fetch media (signed, expire after 2 days)
# ---------------------------------------------------------------------------


def _signer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().secret_key, salt="vbays-public-media")


def public_url(rel_path: str) -> str:
    return f"{get_settings().base_url.rstrip('/')}/m/{_signer().dumps(rel_path)}"


def resolve_public(token: str, max_age: int = 2 * 86400) -> Path | None:
    try:
        rel = _signer().loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    root = (get_settings().storage_dir / "content").resolve()
    path = (get_settings().storage_dir / rel).resolve()
    return path if path.is_file() and root in path.parents else None


def rel(path: Path | None) -> str | None:
    if not path:
        return None
    return str(Path(path).resolve().relative_to(get_settings().storage_dir.resolve()))


def storage(rel_path: str | None) -> Path | None:
    return get_settings().storage_dir / rel_path if rel_path else None


# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------


def brand(db: Session) -> video.Brand:
    s = get_settings()
    logo = s.storage_dir / "brand" / "logo.png"
    return video.Brand(company=s.company_name, phone=planner.setting(db, "business_phone", ""),
                       website=planner.setting(db, "website", "www.avinainteriors.com"),
                       tagline=planner.setting(db, "tagline", "Timeless Interiors, Crafted in Visakhapatnam"),
                       logo=logo if logo.exists() else None)


def _scenes(pkg: dict, media: dict[int, MediaAsset]) -> list[video.Scene]:
    out = []
    for s in pkg.get("scenes") or []:
        a = media.get(s.get("media_id")) if s.get("media_id") else None
        out.append(video.Scene(text=s.get("on_screen_text", ""), voice=s.get("voiceover", ""),
                               seconds=float(s.get("seconds") or 3.5), media=abs_path(a) if a else None,
                               media_kind=a.kind if a else "card", label=(s.get("label") or "").upper()))
    return out


def _best_photo(item: ContentItem, media: dict[int, MediaAsset]) -> Path | None:
    photos = [a for a in media.values() if a.kind == "photo"]
    photos.sort(key=lambda a: -(a.quality_score or 0))
    if photos:
        return abs_path(photos[0])
    vids = [a for a in media.values() if a.kind == "video"]
    if vids:
        return video.video_frame(abs_path(vids[0]), storage(f"content/{item.id}/frame.jpg"))
    return None


def produce(db: Session, item: ContentItem) -> ContentItem:
    """Write (if needed) and render one content item, then schedule it or ask for approval."""
    if not item.package:
        item.package, item.check, _ = planner.write_package(db, item)
        item.status = "written"
    pkg = item.package
    out_dir = get_settings().storage_dir / "content" / str(item.id)
    out_dir.mkdir(parents=True, exist_ok=True)
    media = {a.id: a for a in db.scalars(select(MediaAsset).where(MediaAsset.id.in_(item.media_ids or [])))}
    b = brand(db)
    title = pkg.get("thumbnail_text") or item.topic[:40]

    if item.format in ("reel", "long_video"):
        orient = "vertical" if item.format == "reel" else "landscape"
        r = video.make_video(_scenes(pkg, media), orient, b, item.language, out_dir / f"{orient}.mp4",
                             template=item.template, cta=pkg.get("cta", ""), intro_title=pkg.get("hook", "")[:60],
                             max_seconds=video.MAX_REEL_SECONDS if orient == "vertical" else None)
        if orient == "vertical":
            item.video_path = rel(r["path"])
        else:
            item.video_landscape_path = rel(r["path"])
        item.subtitles_path = rel(r["srt"])
    if item.format in ("carousel", "post", "linkedin_post"):
        slides = []
        for s in (pkg.get("carousel_slides") or [])[: 1 if item.format != "carousel" else 10]:
            a = media.get(s.get("media_id")) if s.get("media_id") else None
            slides.append({"path": abs_path(a) if a else None, "kind": a.kind if a else "card", "text": s.get("text", "")})
        if not slides:
            slides = [{"path": _best_photo(item, media), "text": title}]
        item.image_paths = [rel(p) for p in video.slide_images(slides, b, out_dir / "slides")]

    photo = _best_photo(item, media)
    thumb_size = video.SIZES["landscape"] if item.format != "reel" else (1080, 1920)
    item.thumbnail_path = rel(video.thumbnail(thumb_size, photo, title, b, out_dir / "thumbnail.jpg"))
    if item.format == "reel":  # YouTube thumbnail (16:9) too
        video.thumbnail((1280, 720), photo, title, b, out_dir / "thumbnail_yt.jpg")
    mark_used(db, list(media))
    item.status, item.error = "rendered", None
    route(db, item)
    return item


def route(db: Session, item: ContentItem) -> None:
    """Decide per platform: schedule automatically, or ask for approval on Telegram."""
    ok = planner.auto_ok(item)
    now = datetime.now(timezone.utc)
    for p in db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)):
        if p.status not in ("waiting",):
            continue
        policy = planner.setting(db, f"platform_policy_{p.platform}", "approve" if p.platform == "linkedin" else "auto")
        if policy == "auto" and ok:
            p.status = "scheduled"
            if p.scheduled_at < now:
                p.scheduled_at = now + timedelta(minutes=2)
        else:
            p.status = "awaiting_approval"
            p.approval_id = _ask_approval(db, item, p, reason="" if policy != "auto" else _why_review(item)).id
    item.status = "scheduled"


def _why_review(item: ContentItem) -> str:
    pkg, chk = item.package or {}, item.check or {}
    reasons = list(pkg.get("missing_info") or []) + list(chk.get("problems") or [])
    return "Needs your check: " + "; ".join(reasons)[:600] if reasons else ""


def _ask_approval(db: Session, item: ContentItem, post: SocialPost, reason: str = "") -> Approval:
    pkg = item.package or {}
    text = pkg.get("linkedin_text") if post.platform == "linkedin" else pkg.get("caption", "")
    when = post.scheduled_at.astimezone(planner.tz()).strftime("%a %d %b %H:%M")
    summary = (f"{reason}\n\n" if reason else "") + f"🕒 {when}\n\n{(text or '')[:800]}\n\n" \
              f"Preview: {get_settings().base_url}/marketing/item/{item.id}"
    a = approvals.request(db, kind="marketing_post", title=f"{post.platform.title()} {item.format}: {item.topic[:80]}",
                          summary=summary, payload={"item_id": item.id, "post_id": post.id},
                          approver_role="owner", entity_type="social_post", entity_id=post.id)
    # also send the picture so the owner can judge it on the phone
    thumb = storage(item.thumbnail_path)
    for u in approvals.approvers_for(db, "owner"):
        if u.telegram_chat_id and thumb and thumb.exists():
            outbox.send(db, "telegram", str(u.telegram_chat_id), f"Preview for approval #{a.id}",
                        payload={"photo_path": str(thumb)})
    return a


def _on_approved(db: Session, a: Approval, user: User) -> None:
    p = db.get(SocialPost, (a.payload or {}).get("post_id"))
    if p and p.status == "awaiting_approval":
        p.status = "scheduled"
        now = datetime.now(timezone.utc)
        if p.scheduled_at < now:
            p.scheduled_at = now + timedelta(minutes=2)


def _on_rejected(db: Session, a: Approval, user: User) -> None:
    p = db.get(SocialPost, (a.payload or {}).get("post_id"))
    if p:
        p.status = "rejected"


def _on_changes(db: Session, a: Approval, user: User) -> None:
    """Needs changes → write it again (new text/video), then ask again."""
    p = db.get(SocialPost, (a.payload or {}).get("post_id"))
    item = db.get(ContentItem, (a.payload or {}).get("item_id"))
    if p and item:
        item.package, item.check = None, None
        item.status = "planned"
        item.error = "Owner asked for changes" + (f": {a.decision_note}" if a.decision_note else "")
        for sp in db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)):
            if sp.status in ("awaiting_approval", "scheduled"):
                sp.status = "waiting"


approvals.register_handler("marketing_post", on_approved=_on_approved, on_rejected=_on_rejected,
                           on_changes=_on_changes)


def produce_due(db: Session, hours_ahead: int = 48, limit: int = 3) -> str:
    until = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
    items = list(db.scalars(select(ContentItem).where(ContentItem.status.in_(["planned", "written"]),
                                                      ContentItem.scheduled_at <= until)
                            .order_by(ContentItem.scheduled_at).limit(limit)))
    done = 0
    for item in items:
        try:
            produce(db, item)
            done += 1
        except Exception as exc:
            log.exception("Production failed for item %s", item.id)
            item.status, item.error = "failed", str(exc)[:1000]
            _notify_owner(db, f"⚠️ Could not make content #{item.id} ({item.topic[:60]}): {str(exc)[:200]}")
        db.commit()
    return f"{done}/{len(items)} produced"


# ---------------------------------------------------------------------------
# Publishing
# ---------------------------------------------------------------------------


def paused(db: Session) -> bool:
    return planner.setting(db, "marketing_paused", "no") == "yes"


def _caption(pkg: dict) -> str:
    tags = " ".join(pkg.get("hashtags") or [])
    return f"{pkg.get('caption', '').strip()}\n\n{tags}".strip()[:2200]


def _do_publish(db: Session, p: SocialPost, item: ContentItem) -> dict:
    from app.integrations import google, instagram, linkedin

    pkg = item.package or {}
    if p.platform == "instagram":
        cap = _caption(pkg)
        if item.format == "reel":
            return instagram.publish_reel(db, public_url(item.video_path), cap,
                                          cover_url=public_url(item.thumbnail_path) if item.thumbnail_path else None)
        if item.format == "carousel" and len(item.image_paths or []) > 1:
            return instagram.publish_carousel(db, [public_url(x) for x in item.image_paths], cap)
        return instagram.publish_image(db, public_url((item.image_paths or [item.thumbnail_path])[0]), cap)
    if p.platform == "youtube":
        yt = pkg.get("youtube") or {}
        desc = yt.get("description", "")
        if yt.get("chapters"):
            desc += "\n\n" + "\n".join(yt["chapters"])
        desc += "\n\n" + " ".join((pkg.get("hashtags") or [])[:10])
        if item.format == "reel":
            title = yt.get("title", item.topic)[:90]
            title = title if "#shorts" in title.lower() else f"{title} #Shorts"
            path = storage(item.video_path)
            thumb = storage(f"content/{item.id}/thumbnail_yt.jpg")
        else:
            title = yt.get("title", item.topic)
            path = storage(item.video_landscape_path)
            thumb = storage(item.thumbnail_path)
        r = google.upload_video(db, path, title, desc, yt.get("tags") or [], thumbnail=thumb)
        return {"id": r["id"], "permalink": r["url"]}
    if p.platform == "linkedin":
        img = storage((item.image_paths or [None])[0]) or storage(item.thumbnail_path)
        return linkedin.publish(db, pkg.get("linkedin_text") or pkg.get("caption", ""), img,
                                title=pkg.get("thumbnail_text", ""))
    raise RuntimeError(f"Unknown platform {p.platform}")


def publish_one(db: Session, p: SocialPost) -> SocialPost:
    item = db.get(ContentItem, p.content_item_id)
    now = datetime.now(timezone.utc)
    if outbox.is_test_mode(db, MODULE):
        outbox.send(db, p.platform, p.platform, f"[{item.format}] {item.topic}\n\n{_caption(item.package or {})}",
                    audience="public", approved=True, module_code=MODULE,
                    payload={"content_item_id": item.id, "social_post_id": p.id})
        p.status, p.published_at = "test", now
    else:
        p.attempts += 1
        try:
            r = _do_publish(db, p, item)
            outbox.send(db, p.platform, p.platform, f"Published {item.format}: {item.topic}", audience="public",
                        approved=True, module_code=MODULE, deliver=lambda: r, payload={"social_post_id": p.id})
            p.status, p.published_at, p.remote_id, p.permalink, p.error = "published", now, r.get("id"), \
                r.get("permalink"), None
            _notify_owner(db, f"✅ Posted on {p.platform.title()}: {item.topic[:80]}\n{p.permalink or ''}")
        except Exception as exc:
            log.exception("Publishing post %s failed", p.id)
            p.error = str(exc)[:1000]
            if p.attempts >= MAX_ATTEMPTS:
                p.status = "failed"
                _notify_owner(db, f"⚠️ Could not post on {p.platform.title()} after {p.attempts} tries: "
                                  f"{item.topic[:60]}\nReason: {str(exc)[:300]}")
            else:
                p.scheduled_at = now + timedelta(minutes=15 * p.attempts)
    audit.log(db, f"marketing.{p.status}", None, "social_post", p.id, {"platform": p.platform}, channel="system")
    posts = list(db.scalars(select(SocialPost).where(SocialPost.content_item_id == item.id)))
    if all(x.status in ("published", "test", "rejected", "failed") for x in posts):
        item.status = "published" if any(x.status in ("published", "test") for x in posts) else "failed"
    return p


def publish_due(db: Session) -> str:
    if paused(db):
        return "paused"
    now = datetime.now(timezone.utc)
    due = list(db.scalars(select(SocialPost).where(SocialPost.status == "scheduled", SocialPost.scheduled_at <= now)
                          .order_by(SocialPost.scheduled_at).limit(10)))
    for p in due:
        # Instagram allows 25 API posts per 24 h; stay well below
        if p.platform == "instagram":
            last_day = db.scalar(select(func.count()).select_from(SocialPost).where(
                SocialPost.platform == "instagram", SocialPost.status == "published",
                SocialPost.published_at >= now - timedelta(hours=24)))
            if last_day >= 20:
                continue
        publish_one(db, p)
        db.commit()
    return f"{len(due)} due"


def _notify_owner(db: Session, text: str) -> None:
    for u in approvals.approvers_for(db, "owner"):
        if u.telegram_chat_id:
            outbox.send(db, "telegram", str(u.telegram_chat_id), text)
