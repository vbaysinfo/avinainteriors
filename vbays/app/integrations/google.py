"""Google: sign-in (OAuth), YouTube uploads/comments/stats, and Google Drive media.

Setup (once): Google Cloud Console → new project → enable "YouTube Data API
v3" and "Google Drive API" → OAuth consent screen → Credentials → OAuth client
ID of type "Web application" with redirect URI  {BASE_URL}/marketing/connect/google/callback
→ put the client ID/secret in .env → Vbays → Marketing → Connections → Connect Google.
"""
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.integrations import connections

PLATFORM = "google"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",  # read + reply to comments
    "https://www.googleapis.com/auth/drive.readonly",
]
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
YT = "https://www.googleapis.com/youtube/v3"


class GoogleError(Exception):
    pass


def redirect_uri() -> str:
    return get_settings().base_url.rstrip("/") + "/marketing/connect/google/callback"


def auth_url(state: str) -> str:
    s = get_settings()
    return AUTH_URL + "?" + urlencode({
        "client_id": s.google_client_id, "redirect_uri": redirect_uri(), "response_type": "code",
        "scope": " ".join(SCOPES), "access_type": "offline", "prompt": "consent", "state": state,
        "include_granted_scopes": "true",
    })


def _check(r: httpx.Response) -> dict:
    try:
        body = r.json() if r.content else {}
    except ValueError:
        body = {}
    if r.status_code >= 400:
        err = body.get("error")
        msg = err.get("message") if isinstance(err, dict) else (body.get("error_description") or err)
        raise GoogleError(msg or f"HTTP {r.status_code}: {r.text[:300]}")
    return body


def finish_auth(db: Session, code: str, user_id: int | None = None):
    s = get_settings()
    body = _check(httpx.post(TOKEN_URL, data={
        "code": code, "client_id": s.google_client_id, "client_secret": s.google_client_secret,
        "redirect_uri": redirect_uri(), "grant_type": "authorization_code"}, timeout=30))
    tok = body["access_token"]
    ch = _check(httpx.get(f"{YT}/channels", params={"part": "snippet", "mine": "true"},
                          headers={"Authorization": f"Bearer {tok}"}, timeout=30))
    items = ch.get("items") or []
    return connections.save(
        db, PLATFORM, tok, refresh_token=body.get("refresh_token"),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(body.get("expires_in", 3600))),
        account_id=items[0]["id"] if items else None,
        account_name=items[0]["snippet"]["title"] if items else "(no YouTube channel)",
        scopes=body.get("scope"), user_id=user_id,
    )


def access_token(db: Session) -> str:
    c, tok = connections.token(db, PLATFORM)
    if not connections.expired(c):
        return tok
    from app.core import secrets

    refresh = secrets.decrypt(c.refresh_token_enc)
    if not refresh:
        raise connections.NotConnected("Google login expired. Reconnect Google on Marketing → Connections.")
    s = get_settings()
    body = _check(httpx.post(TOKEN_URL, data={
        "client_id": s.google_client_id, "client_secret": s.google_client_secret,
        "refresh_token": refresh, "grant_type": "refresh_token"}, timeout=30))
    connections.save(db, PLATFORM, body["access_token"],
                     expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(body.get("expires_in", 3600))))
    return body["access_token"]


def _h(db: Session) -> dict:
    return {"Authorization": f"Bearer {access_token(db)}"}


# ---------------------------------------------------------------------------
# YouTube
# ---------------------------------------------------------------------------


def upload_video(db: Session, path: Path, title: str, description: str, tags: list[str],
                 privacy: str = "public", thumbnail: Path | None = None) -> dict:
    """Resumable upload (works for big files). Returns {"id", "url"}."""
    size = os.path.getsize(path)
    meta = {
        "snippet": {"title": title[:100], "description": description[:5000], "tags": tags[:30],
                    "categoryId": "26", "defaultLanguage": "en"},  # 26 = Howto & Style
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    r = httpx.post("https://www.googleapis.com/upload/youtube/v3/videos",
                   params={"uploadType": "resumable", "part": "snippet,status"},
                   headers={**_h(db), "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)},
                   json=meta, timeout=60)
    _check(r)
    upload_url = r.headers["Location"]
    with open(path, "rb") as f:
        r = httpx.put(upload_url, content=f.read(), headers={"Content-Type": "video/mp4"}, timeout=1800)
    video = _check(r)
    vid = video["id"]
    if thumbnail and thumbnail.exists():
        try:  # custom thumbnails need a verified channel; ignore if not allowed
            with open(thumbnail, "rb") as f:
                httpx.post("https://www.googleapis.com/upload/youtube/v3/thumbnails/set", params={"videoId": vid},
                           headers={**_h(db), "Content-Type": "image/jpeg"}, content=f.read(), timeout=120)
        except httpx.HTTPError:
            pass
    return {"id": vid, "url": f"https://www.youtube.com/watch?v={vid}", "privacy": video.get("status", {}).get("privacyStatus")}


def recent_comments(db: Session, video_id: str) -> list[dict]:
    body = _check(httpx.get(f"{YT}/commentThreads", params={
        "part": "snippet", "videoId": video_id, "maxResults": 50, "order": "time", "textFormat": "plainText"},
        headers=_h(db), timeout=30))
    out = []
    for t in body.get("items", []):
        top = t["snippet"]["topLevelComment"]
        sn = top["snippet"]
        out.append({"id": top["id"], "text": sn.get("textDisplay", ""), "author": sn.get("authorDisplayName"),
                    "author_id": (sn.get("authorChannelId") or {}).get("value"), "timestamp": sn.get("publishedAt")})
    return out


def reply_comment(db: Session, parent_id: str, text: str) -> str:
    body = _check(httpx.post(f"{YT}/comments", params={"part": "snippet"}, headers=_h(db),
                             json={"snippet": {"parentId": parent_id, "textOriginal": text}}, timeout=30))
    return body["id"]


def video_stats(db: Session, video_ids: list[str]) -> dict[str, dict]:
    if not video_ids:
        return {}
    body = _check(httpx.get(f"{YT}/videos", params={"part": "statistics", "id": ",".join(video_ids[:50])},
                            headers=_h(db), timeout=30))
    return {v["id"]: v.get("statistics", {}) for v in body.get("items", [])}


def channel_stats(db: Session) -> dict:
    body = _check(httpx.get(f"{YT}/channels", params={"part": "statistics", "mine": "true"}, headers=_h(db),
                            timeout=30))
    items = body.get("items") or [{}]
    return items[0].get("statistics", {})


# ---------------------------------------------------------------------------
# Google Drive (media inbox)
# ---------------------------------------------------------------------------


def drive_list(db: Session, folder_id: str) -> list[dict]:
    """All photos/videos in the folder and its sub-folders (one level)."""
    def list_q(q):
        files, page = [], None
        while True:
            params = {"q": q, "fields": "nextPageToken,files(id,name,mimeType,size,createdTime,parents)",
                      "pageSize": 200, "supportsAllDrives": "true", "includeItemsFromAllDrives": "true"}
            if page:
                params["pageToken"] = page
            body = _check(httpx.get("https://www.googleapis.com/drive/v3/files", params=params, headers=_h(db),
                                    timeout=60))
            files += body.get("files", [])
            page = body.get("nextPageToken")
            if not page:
                return files

    items = list_q(f"'{folder_id}' in parents and trashed=false")
    media = []
    for f in items:
        if f["mimeType"] == "application/vnd.google-apps.folder":
            for g in list_q(f"'{f['id']}' in parents and trashed=false"):
                if g["mimeType"].startswith(("image/", "video/")):
                    media.append({**g, "project": f["name"]})
        elif f["mimeType"].startswith(("image/", "video/")):
            media.append({**f, "project": None})
    return media


def drive_download(db: Session, file_id: str, target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    with httpx.stream("GET", f"https://www.googleapis.com/drive/v3/files/{file_id}", params={"alt": "media"},
                      headers=_h(db), timeout=600, follow_redirects=True) as r:
        if r.status_code >= 400:
            raise GoogleError(f"Drive download failed: HTTP {r.status_code}")
        with open(target, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    return target
