"""LinkedIn (official Posts API). Posts to YOUR LinkedIn profile.

Setup (once): https://www.linkedin.com/developers → Create app → Products:
add "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" →
Auth tab: add redirect URL  {BASE_URL}/marketing/connect/linkedin/callback
→ put client ID/secret in .env → Vbays → Marketing → Connections → Connect LinkedIn.

Posting as a Company Page needs LinkedIn's "Community Management API"
approval. We can add that later.
LinkedIn tokens last about 60 days; Vbays reminds you on Telegram to reconnect.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.integrations import connections

PLATFORM = "linkedin"
SCOPES = "openid profile w_member_social"


class LinkedInError(Exception):
    pass


def redirect_uri() -> str:
    return get_settings().base_url.rstrip("/") + "/marketing/connect/linkedin/callback"


def auth_url(state: str) -> str:
    return "https://www.linkedin.com/oauth/v2/authorization?" + urlencode({
        "response_type": "code", "client_id": get_settings().linkedin_client_id,
        "redirect_uri": redirect_uri(), "state": state, "scope": SCOPES})


def _check(r: httpx.Response) -> dict:
    if r.status_code >= 400:
        try:
            msg = r.json().get("message") or r.json().get("error_description")
        except ValueError:
            msg = r.text[:300]
        raise LinkedInError(msg or f"HTTP {r.status_code}")
    return r.json() if r.content else {}


def finish_auth(db: Session, code: str, user_id: int | None = None):
    s = get_settings()
    body = _check(httpx.post("https://www.linkedin.com/oauth/v2/accessToken", data={
        "grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri(),
        "client_id": s.linkedin_client_id, "client_secret": s.linkedin_client_secret}, timeout=30))
    tok = body["access_token"]
    me = _check(httpx.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization": f"Bearer {tok}"},
                          timeout=30))
    return connections.save(
        db, PLATFORM, tok, refresh_token=body.get("refresh_token"),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=int(body.get("expires_in", 5184000))),
        account_id=f"urn:li:person:{me['sub']}", account_name=me.get("name"), scopes=body.get("scope"),
        user_id=user_id,
    )


def _headers(tok: str) -> dict:
    return {"Authorization": f"Bearer {tok}", "LinkedIn-Version": get_settings().linkedin_api_version,
            "X-Restli-Protocol-Version": "2.0.0"}


def _upload_image(tok: str, author: str, image: Path) -> str:
    body = _check(httpx.post("https://api.linkedin.com/rest/images?action=initializeUpload", headers=_headers(tok),
                             json={"initializeUploadRequest": {"owner": author}}, timeout=30))
    value = body["value"]
    with open(image, "rb") as f:
        r = httpx.put(value["uploadUrl"], content=f.read(), timeout=300)
    if r.status_code >= 400:
        raise LinkedInError(f"Image upload failed: HTTP {r.status_code}")
    return value["image"]


def publish(db: Session, text: str, image: Path | None = None, title: str = "") -> dict:
    c, tok = connections.token(db, PLATFORM)
    if connections.expired(c):
        raise connections.NotConnected("LinkedIn login expired. Reconnect LinkedIn on Marketing → Connections.")
    post = {
        "author": c.account_id,
        "commentary": text[:3000],
        "visibility": "PUBLIC",
        "distribution": {"feedDistribution": "MAIN_FEED", "targetEntities": [], "thirdPartyDistributionChannels": []},
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }
    if image and image.exists():
        post["content"] = {"media": {"id": _upload_image(tok, c.account_id, image), "title": title[:200]}}
    r = httpx.post("https://api.linkedin.com/rest/posts", headers=_headers(tok), json=post, timeout=60)
    _check(r)
    urn = r.headers.get("x-restli-id", "")
    return {"id": urn, "permalink": f"https://www.linkedin.com/feed/update/{urn}/" if urn else None}
