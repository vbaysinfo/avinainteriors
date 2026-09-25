"""Shared helpers for admin pages: templates, CSRF protection, flash messages."""
import secrets
from pathlib import Path

from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from markupsafe import Markup

from app.config import get_settings
from app.core.permissions import ROLES, has_permission

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


def csrf_token(request: Request) -> str:
    tok = request.session.get("csrf")
    if not tok:
        tok = secrets.token_urlsafe(32)
        request.session["csrf"] = tok
    return tok


async def check_csrf(request: Request) -> None:
    """Dependency for every POST: the form must carry this session's token."""
    form = await request.form()
    if not secrets.compare_digest(str(form.get("csrf_token", "")), request.session.get("csrf", "")):
        raise HTTPException(status_code=400, detail="Form expired. Go back, refresh the page and try again.")


def flash(request: Request, text: str, kind: str = "ok") -> None:
    request.session.setdefault("flash", []).append([kind, text])


def redirect(url: str) -> RedirectResponse:
    return RedirectResponse(url, status_code=303)


def render(request: Request, template: str, user=None, **ctx):
    flashes = request.session.pop("flash", [])
    s = get_settings()
    return templates.TemplateResponse(
        request,
        template,
        {
            "user": user,
            "settings": s,
            "roles": ROLES,
            "can": (lambda perm: has_permission(user.role, perm)) if user else (lambda perm: False),
            "csrf_input": Markup(f'<input type="hidden" name="csrf_token" value="{csrf_token(request)}">'),
            "flashes": flashes,
            **ctx,
        },
    )


def rupees(paise: int | None) -> str:
    if paise is None:
        return ""
    rupee, p = divmod(int(paise), 100)
    # Indian digit grouping: 12,34,567
    s = str(rupee)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts) + "," + tail
    return f"₹{s}" + (f".{p:02d}" if p else "")


templates.env.filters["rupees"] = rupees
