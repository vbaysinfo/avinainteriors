"""Instagram (official "Instagram API with Instagram Login", graph.instagram.com).

Setup (once): Meta developer app → add "Instagram" product → "API setup with
Instagram login" → add your Instagram Business account → Generate token.
Paste that token on Vbays → Marketing → Connections. Vbays refreshes it
automatically (tokens last 60 days).

Instagram fetches photos/videos from a PUBLIC web address, so Vbays must be
reachable on the internet (BASE_URL=https://…) when posting.
"""
import time
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.integrations import connections

PLATFORM = "instagram"


class InstagramError(Exception):
    pass


def _base() -> str:
    return f"https://graph.instagram.com/{get_settings().instagram_api_version}"


def _check(r: httpx.Response) -> dict:
    try:
        body = r.json()
    except ValueError:
        raise InstagramError(f"HTTP {r.status_code}: {r.text[:300]}") from None
    if r.status_code >= 400 or "error" in body:
        err = body.get("error", {})
        raise InstagramError(err.get("message") or f"HTTP {r.status_code}")
    return body


def connect_with_token(db: Session, token: str, user_id: int | None = None):
    """Check a pasted token, find the account, and save it."""
    r = httpx.get(f"{_base()}/me", params={"fields": "user_id,username,followers_count,media_count",
                                            "access_token": token}, timeout=30)
    me = _check(r)
    return connections.save(
        db, PLATFORM, token, expires_at=datetime.now(timezone.utc) + timedelta(days=60),
        account_id=str(me.get("user_id") or me.get("id")), account_name="@" + me.get("username", ""),
        extra={"followers": me.get("followers_count")}, user_id=user_id,
    )


def refresh_token(db: Session) -> str:
    c, tok = connections.token(db, PLATFORM)
    r = httpx.get("https://graph.instagram.com/refresh_access_token",
                  params={"grant_type": "ig_refresh_token", "access_token": tok}, timeout=30)
    body = _check(r)
    connections.save(db, PLATFORM, body["access_token"],
                     expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(body.get("expires_in", 5184000))))
    return "refreshed"


def _creds(db: Session) -> tuple[str, str]:
    c, tok = connections.token(db, PLATFORM)
    return c.account_id, tok


def _wait_ready(container_id: str, tok: str, timeout_s: int = 600) -> None:
    start = time.monotonic()
    while True:
        r = httpx.get(f"{_base()}/{container_id}", params={"fields": "status_code,status", "access_token": tok},
                      timeout=30)
        body = _check(r)
        code = body.get("status_code")
        if code == "FINISHED":
            return
        if code in ("ERROR", "EXPIRED"):
            raise InstagramError(f"Instagram could not process the media: {body.get('status')}")
        if time.monotonic() - start > timeout_s:
            raise InstagramError("Instagram took too long to process the video.")
        time.sleep(5)


def _create(ig_id: str, tok: str, **params) -> str:
    r = httpx.post(f"{_base()}/{ig_id}/media", data={**params, "access_token": tok}, timeout=120)
    return _check(r)["id"]


def _publish(ig_id: str, tok: str, container_id: str) -> dict:
    r = httpx.post(f"{_base()}/{ig_id}/media_publish", data={"creation_id": container_id, "access_token": tok},
                   timeout=120)
    media_id = _check(r)["id"]
    r = httpx.get(f"{_base()}/{media_id}", params={"fields": "permalink", "access_token": tok}, timeout=30)
    link = r.json().get("permalink") if r.status_code == 200 else None
    return {"id": media_id, "permalink": link}


def publish_reel(db: Session, video_url: str, caption: str, cover_url: str | None = None) -> dict:
    ig_id, tok = _creds(db)
    params = {"media_type": "REELS", "video_url": video_url, "caption": caption, "share_to_feed": "true"}
    if cover_url:
        params["cover_url"] = cover_url
    cid = _create(ig_id, tok, **params)
    _wait_ready(cid, tok)
    return _publish(ig_id, tok, cid)


def publish_image(db: Session, image_url: str, caption: str) -> dict:
    ig_id, tok = _creds(db)
    cid = _create(ig_id, tok, image_url=image_url, caption=caption)
    _wait_ready(cid, tok, 120)
    return _publish(ig_id, tok, cid)


def publish_carousel(db: Session, image_urls: list[str], caption: str) -> dict:
    ig_id, tok = _creds(db)
    children = []
    for url in image_urls[:10]:
        children.append(_create(ig_id, tok, image_url=url, is_carousel_item="true"))
    for c in children:
        _wait_ready(c, tok, 120)
    cid = _create(ig_id, tok, media_type="CAROUSEL", children=",".join(children), caption=caption)
    _wait_ready(cid, tok, 120)
    return _publish(ig_id, tok, cid)


def recent_comments(db: Session, media_id: str) -> list[dict]:
    _, tok = _creds(db)
    r = httpx.get(f"{_base()}/{media_id}/comments",
                  params={"fields": "id,text,username,timestamp,from", "access_token": tok}, timeout=30)
    return _check(r).get("data", [])


def reply_comment(db: Session, comment_id: str, message: str) -> str:
    _, tok = _creds(db)
    r = httpx.post(f"{_base()}/{comment_id}/replies", data={"message": message, "access_token": tok}, timeout=30)
    return _check(r)["id"]


def recent_dms(db: Session) -> list[dict]:
    """Recent direct messages (needs the instagram_business_manage_messages permission)."""
    ig_id, tok = _creds(db)
    r = httpx.get(f"{_base()}/me/conversations",
                  params={"platform": "instagram", "fields": "id,messages.limit(5){id,message,from,created_time}",
                          "access_token": tok}, timeout=30)
    out = []
    for conv in _check(r).get("data", []):
        for m in (conv.get("messages") or {}).get("data", []):
            sender = m.get("from") or {}
            if str(sender.get("id")) == str(ig_id):
                continue  # our own message
            out.append({"id": m["id"], "text": m.get("message", ""), "from_id": sender.get("id"),
                        "username": sender.get("username"), "timestamp": m.get("created_time"), "thread": conv["id"]})
    return out


def send_dm(db: Session, recipient_id: str, text: str) -> str:
    _, tok = _creds(db)
    r = httpx.post(f"{_base()}/me/messages", json={"recipient": {"id": recipient_id}, "message": {"text": text}},
                   params={"access_token": tok}, timeout=30)
    return str(_check(r).get("message_id", ""))


def account_stats(db: Session) -> dict:
    _, tok = _creds(db)
    r = httpx.get(f"{_base()}/me", params={"fields": "username,followers_count,media_count", "access_token": tok},
                  timeout=30)
    return _check(r)


def media_stats(db: Session, media_id: str) -> dict:
    _, tok = _creds(db)
    r = httpx.get(f"{_base()}/{media_id}", params={"fields": "like_count,comments_count", "access_token": tok},
                  timeout=30)
    return _check(r)
