"""Admin website pages (Phase 1)."""
import re
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import approvals, audit, backup, knowledge, masterdata
from app.core.auth import authenticate, current_user, hash_password, require
from app.core.db import get_db
from app.core.models import (
    Approval,
    AuditLog,
    JobRun,
    ModuleSwitch,
    Notification,
    OutboxMessage,
    Setting,
    User,
)
from app.core.permissions import PERMISSIONS, ROLE_PERMISSIONS, ROLES
from app.core.scheduler import run_job
from app.integrations import telegram_bot
from app.web.common import check_csrf, flash, redirect, render

router = APIRouter()
CSRF = [Depends(check_csrf)]


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


@router.get("/login")
def login_page(request: Request):
    return render(request, "login.html")


@router.post("/login", dependencies=CSRF)
def login(request: Request, login: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = authenticate(db, login, password)
    if not user:
        audit.log(db, "login.failed", None, details={"login": login[:100]}, ip=_ip(request))
        flash(request, "Wrong email/phone or password (5 wrong tries locks the account).", "error")
        return redirect("/login")
    request.session.clear()
    request.session["user_id"] = user.id
    request.session["login_at"] = datetime.now(timezone.utc).isoformat()
    audit.log(db, "login.ok", user, ip=_ip(request))
    return redirect("/")


@router.post("/logout", dependencies=CSRF)
def logout(request: Request):
    request.session.clear()
    return redirect("/login")


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@router.get("/")
def dashboard(request: Request, user: User = Depends(require("dashboard.view")), db: Session = Depends(get_db)):
    pending = db.scalar(select(func.count()).select_from(Approval).where(Approval.status == "pending"))
    stats = {
        "pending_approvals": pending,
        "staff": db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))),
        "outbox_test": db.scalar(select(func.count()).select_from(OutboxMessage).where(OutboxMessage.status == "test")),
        "modules_on": db.scalar(select(func.count()).select_from(ModuleSwitch).where(ModuleSwitch.enabled.is_(True))),
    }
    datasets = [(ds, masterdata.count(db, ds)) for ds in masterdata.DATASETS.values()]
    last_backup = db.scalar(select(JobRun).where(JobRun.job_name.like("%backup%")).order_by(JobRun.id.desc()).limit(1))
    notes = list(db.scalars(select(Notification).where(Notification.user_id == user.id, Notification.read_at.is_(None))
                            .order_by(Notification.id.desc()).limit(10)))
    return render(request, "dashboard.html", user, stats=stats, datasets=datasets, last_backup=last_backup, notes=notes)


@router.post("/notifications/read", dependencies=CSRF)
def notifications_read(user: User = Depends(current_user), db: Session = Depends(get_db)):
    for n in db.scalars(select(Notification).where(Notification.user_id == user.id, Notification.read_at.is_(None))):
        n.read_at = datetime.now(timezone.utc)
    return redirect("/")


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


@router.get("/users")
def users_page(request: Request, user: User = Depends(require("users.manage")), db: Session = Depends(get_db)):
    users = list(db.scalars(select(User).order_by(User.is_active.desc(), User.role, User.name)))
    return render(request, "users.html", user, users=users, permissions=PERMISSIONS, role_permissions=ROLE_PERMISSIONS)


def _clean_phone(phone: str) -> str | None:
    digits = re.sub(r"[^\d+]", "", phone or "")
    return digits or None


@router.post("/users", dependencies=CSRF)
def user_create(
    request: Request,
    name: str = Form(...),
    role: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    password: str = Form(""),
    user: User = Depends(require("users.manage")),
    db: Session = Depends(get_db),
):
    if role not in ROLES:
        raise HTTPException(400, "Unknown role")
    email = email.strip().lower() or None
    phone = _clean_phone(phone)
    if not email and not phone:
        flash(request, "Give an email or a phone number.", "error")
        return redirect("/users")
    if password and len(password) < 8:
        flash(request, "Password must be at least 8 characters.", "error")
        return redirect("/users")
    clash = db.scalar(select(User).where((User.email == email) if email else (User.phone == phone)))
    if clash:
        flash(request, "A user with that email/phone already exists.", "error")
        return redirect("/users")
    new = User(name=name.strip(), role=role, email=email, phone=phone,
               password_hash=hash_password(password) if password else None)
    db.add(new)
    db.flush()
    audit.log(db, "user.created", user, "user", new.id, {"role": role}, ip=_ip(request))
    flash(request, f"Added {new.name} as {ROLES[role]}.")
    return redirect("/users")


@router.post("/users/{uid}", dependencies=CSRF)
def user_update(
    request: Request,
    uid: int,
    action: str = Form(...),
    role: str = Form(""),
    password: str = Form(""),
    user: User = Depends(require("users.manage")),
    db: Session = Depends(get_db),
):
    target = db.get(User, uid)
    if not target:
        raise HTTPException(404)
    if action == "role":
        if role not in ROLES:
            raise HTTPException(400, "Unknown role")
        if target.id == user.id and role != "owner":
            flash(request, "You can't remove your own owner role.", "error")
            return redirect("/users")
        audit.log(db, "user.role_changed", user, "user", uid, {"from": target.role, "to": role}, ip=_ip(request))
        target.role = role
        flash(request, f"{target.name} is now {ROLES[role]}.")
    elif action == "toggle":
        if target.id == user.id:
            flash(request, "You can't deactivate yourself.", "error")
            return redirect("/users")
        target.is_active = not target.is_active
        audit.log(db, "user.activated" if target.is_active else "user.deactivated", user, "user", uid, ip=_ip(request))
        flash(request, f"{target.name} {'activated' if target.is_active else 'deactivated'}.")
    elif action == "password":
        if len(password) < 8:
            flash(request, "Password must be at least 8 characters.", "error")
            return redirect("/users")
        target.password_hash = hash_password(password)
        target.failed_logins = 0
        audit.log(db, "user.password_set", user, "user", uid, ip=_ip(request))
        flash(request, f"Password set for {target.name}.")
    elif action == "telegram_code":
        code = telegram_bot.new_link_code(db, target)
        audit.log(db, "telegram.code_created", user, "user", uid, ip=_ip(request))
        flash(request, f"Telegram link code for {target.name}: {code}. They open the bot and send:  /link {code}  "
                       f"(valid {telegram_bot.LINK_CODE_MINUTES} min)")
    elif action == "telegram_unlink":
        target.telegram_chat_id = None
        audit.log(db, "telegram.unlinked", user, "user", uid, ip=_ip(request))
        flash(request, f"Telegram disconnected for {target.name}.")
    else:
        raise HTTPException(400, "Unknown action")
    return redirect("/users")


# ---------------------------------------------------------------------------
# Modules & settings
# ---------------------------------------------------------------------------


@router.get("/modules")
def modules_page(request: Request, user: User = Depends(require("modules.manage")), db: Session = Depends(get_db)):
    mods = list(db.scalars(select(ModuleSwitch).order_by(ModuleSwitch.code)))
    return render(request, "modules.html", user, modules=mods)


@router.post("/modules/{code}", dependencies=CSRF)
def module_toggle(request: Request, code: str, field: str = Form(...),
                  user: User = Depends(require("modules.manage")), db: Session = Depends(get_db)):
    sw = db.get(ModuleSwitch, code)
    if not sw or field not in ("enabled", "test_mode"):
        raise HTTPException(400)
    if field == "enabled" and not sw.built and not sw.enabled:
        flash(request, f"{sw.name} is not built yet (coming in Phase {sw.phase}).", "error")
        return redirect("/modules")
    setattr(sw, field, not getattr(sw, field))
    audit.log(db, f"module.{field}", user, "module", code, {"value": getattr(sw, field)}, ip=_ip(request))
    flash(request, f"{sw.name}: {field.replace('_', ' ')} is now {'ON' if getattr(sw, field) else 'OFF'}. "
                   "Restart Vbays for screens/jobs to change.")
    return redirect("/modules")


@router.get("/settings")
def settings_page(request: Request, user: User = Depends(require("settings.manage")), db: Session = Depends(get_db)):
    return render(request, "settings.html", user, items=list(db.scalars(select(Setting).order_by(Setting.key))))


@router.post("/settings", dependencies=CSRF)
async def settings_save(request: Request, user: User = Depends(require("settings.manage")), db: Session = Depends(get_db)):
    form = await request.form()
    changed = {}
    for item in db.scalars(select(Setting)):
        new = form.get(f"s_{item.key}")
        if new is not None and str(new) != item.value:
            changed[item.key] = {"from": item.value, "to": str(new)}
            item.value = str(new).strip()
    if changed:
        audit.log(db, "settings.changed", user, "settings", None, changed, ip=_ip(request))
    flash(request, f"Saved ({len(changed)} changed).")
    return redirect("/settings")


# ---------------------------------------------------------------------------
# Knowledge
# ---------------------------------------------------------------------------


@router.get("/knowledge")
def knowledge_list(request: Request, user: User = Depends(require("knowledge.view")), db: Session = Depends(get_db)):
    docs = [(name, knowledge.latest(db, name)) for name in knowledge.KNOWLEDGE_FILES]
    return render(request, "knowledge_list.html", user, docs=docs)


@router.get("/knowledge/{name}")
def knowledge_view(request: Request, name: str, version: int | None = None,
                   user: User = Depends(require("knowledge.view")), db: Session = Depends(get_db)):
    if name not in knowledge.KNOWLEDGE_FILES:
        raise HTTPException(404)
    hist = knowledge.history(db, name)
    doc = next((d for d in hist if d.version == version), hist[0] if hist else None)
    users = {u.id: u.name for u in db.scalars(select(User))}
    return render(request, "knowledge_edit.html", user, name=name, doc=doc, history=hist, users=users)


@router.post("/knowledge/{name}", dependencies=CSRF)
def knowledge_save(request: Request, name: str, content: str = Form(...),
                   user: User = Depends(require("knowledge.edit")), db: Session = Depends(get_db)):
    if name not in knowledge.KNOWLEDGE_FILES:
        raise HTTPException(404)
    doc = knowledge.save(db, name, content.replace("\r\n", "\n"), user)
    audit.log(db, "knowledge.saved", user, "knowledge", name, {"version": doc.version}, ip=_ip(request))
    flash(request, f"Saved {name} as version {doc.version}.")
    return redirect(f"/knowledge/{name}")


# ---------------------------------------------------------------------------
# Master data
# ---------------------------------------------------------------------------


def _dataset(key: str) -> masterdata.Dataset:
    ds = masterdata.DATASETS.get(key)
    if not ds:
        raise HTTPException(404)
    return ds


@router.get("/masterdata")
def masterdata_list(request: Request, user: User = Depends(require("masterdata.view")), db: Session = Depends(get_db)):
    datasets = [(ds, masterdata.count(db, ds)) for ds in masterdata.DATASETS.values()]
    return render(request, "masterdata_list.html", user, datasets=datasets)


@router.get("/masterdata/{key}")
def masterdata_view(request: Request, key: str, user: User = Depends(require("masterdata.view")),
                    db: Session = Depends(get_db)):
    ds = _dataset(key)
    if key == "staff_roles" and user.role != "owner":
        raise HTTPException(403, "Only the owner can see staff details.")
    rows = list(db.scalars(select(ds.model).limit(500)))
    return render(request, "masterdata_view.html", user, ds=ds, rows=rows)


@router.get("/masterdata/{key}/template")
def masterdata_template(key: str, user: User = Depends(require("masterdata.view"))):
    ds = _dataset(key)
    return PlainTextResponse(masterdata.template_csv(ds), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{ds.filename}"'})


def _import_dir():
    d = get_settings().storage_dir / "imports"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/masterdata/{key}/upload", dependencies=CSRF)
async def masterdata_upload(request: Request, key: str, file: UploadFile,
                            user: User = Depends(require("masterdata.import")), db: Session = Depends(get_db)):
    ds = _dataset(key)
    if key == "staff_roles" and user.role != "owner":
        raise HTTPException(403, "Only the owner can import staff.")
    fname = (file.filename or "").lower()
    if not fname.endswith((".csv", ".xlsx")):
        flash(request, "Please upload a .csv or .xlsx file.", "error")
        return redirect(f"/masterdata/{key}")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        flash(request, "File is too big (max 5 MB).", "error")
        return redirect(f"/masterdata/{key}")
    try:
        rows = masterdata.read_table(fname, content)
    except Exception as exc:
        flash(request, f"Could not read the file: {exc}", "error")
        return redirect(f"/masterdata/{key}")
    res = masterdata.preview(db, ds, rows)
    token = secrets.token_hex(12)
    ext = ".xlsx" if fname.endswith(".xlsx") else ".csv"
    (_import_dir() / f"{token}{ext}").write_bytes(content)
    return render(request, "masterdata_preview.html", user, ds=ds, res=res, token=token + ext)


@router.post("/masterdata/{key}/confirm", dependencies=CSRF)
def masterdata_confirm(request: Request, key: str, token: str = Form(...),
                       user: User = Depends(require("masterdata.import")), db: Session = Depends(get_db)):
    ds = _dataset(key)
    if key == "staff_roles" and user.role != "owner":
        raise HTTPException(403)
    if not re.fullmatch(r"[0-9a-f]{24}\.(csv|xlsx)", token):
        raise HTTPException(400)
    path = _import_dir() / token
    if not path.exists():
        flash(request, "Upload expired, please upload again.", "error")
        return redirect(f"/masterdata/{key}")
    res = masterdata.preview(db, ds, masterdata.read_table(path.name, path.read_bytes()))
    path.unlink(missing_ok=True)
    if not res.ok:
        flash(request, "The file has errors; nothing was imported.", "error")
        return redirect(f"/masterdata/{key}")
    added, updated = masterdata.apply(db, ds, res)
    audit.log(db, "masterdata.imported", user, "dataset", key, {"added": added, "updated": updated}, ip=_ip(request))
    flash(request, f"{ds.title}: {added} added, {updated} updated.")
    return redirect(f"/masterdata/{key}")


# ---------------------------------------------------------------------------
# Approvals, outbox, audit, backups
# ---------------------------------------------------------------------------


@router.get("/approvals")
def approvals_page(request: Request, status: str = "pending", user: User = Depends(require("approvals.view")),
                   db: Session = Depends(get_db)):
    q = select(Approval).order_by(Approval.id.desc()).limit(200)
    if status != "all":
        q = q.where(Approval.status == status)
    items = list(db.scalars(q))
    return render(request, "approvals.html", user, items=items, status=status)


@router.post("/approvals/test", dependencies=CSRF)
def approvals_test(request: Request, user: User = Depends(require("approvals.view")), db: Session = Depends(get_db)):
    a = approvals.request(
        db, kind="test", title="TEST: send a sample WhatsApp message to a customer",
        summary="This is a practice approval. Approving it puts a sample customer message in the Outbox "
                "(in test mode it is NOT really sent).",
        requested_by=user, channel="web",
    )
    flash(request, f"Test approval #{a.id} created. Check Telegram (if linked) or approve it below.")
    return redirect("/approvals")


@router.post("/approvals/{aid}", dependencies=CSRF)
def approvals_decide(request: Request, aid: int, decision: str = Form(...), note: str = Form(""),
                     user: User = Depends(require("approvals.view")), db: Session = Depends(get_db)):
    try:
        a = approvals.decide(db, aid, user, decision, note or None, channel="web")
        flash(request, f"#{a.id} {a.status.replace('_', ' ')}.")
    except approvals.ApprovalError as exc:
        flash(request, str(exc), "error")
    return redirect("/approvals")


@router.get("/outbox")
def outbox_page(request: Request, user: User = Depends(require("outbox.view")), db: Session = Depends(get_db)):
    items = list(db.scalars(select(OutboxMessage).order_by(OutboxMessage.id.desc()).limit(200)))
    return render(request, "outbox.html", user, items=items)


@router.get("/audit")
def audit_page(request: Request, q: str = "", user: User = Depends(require("audit.view")), db: Session = Depends(get_db)):
    stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(300)
    if q:
        stmt = stmt.where(AuditLog.action.ilike(f"%{q}%") | AuditLog.user_name.ilike(f"%{q}%"))
    return render(request, "audit.html", user, items=list(db.scalars(stmt)), q=q)


@router.get("/backups")
def backups_page(request: Request, user: User = Depends(require("backups.run")), db: Session = Depends(get_db)):
    runs = list(db.scalars(select(JobRun).order_by(JobRun.id.desc()).limit(30)))
    return render(request, "backups.html", user, files=backup.list_backups(), runs=runs)


@router.post("/backups/run", dependencies=CSRF)
def backups_run(request: Request, user: User = Depends(require("backups.run")), db: Session = Depends(get_db)):
    audit.log(db, "backup.manual", user, ip=_ip(request))
    db.commit()
    run_job("manual_backup", backup.run_backup)
    flash(request, "Backup finished. See the list below (a failed run shows the reason).")
    return redirect("/backups")


@router.get("/backups/{fname}")
def backups_download(request: Request, fname: str, user: User = Depends(require("backups.run")),
                     db: Session = Depends(get_db)):
    if not re.fullmatch(r"vbays-\d{8}-\d{6}\.sql\.gz", fname):
        raise HTTPException(404)
    path = get_settings().backup_dir / fname
    if not path.exists():
        raise HTTPException(404)
    audit.log(db, "backup.downloaded", user, "backup", fname, ip=_ip(request))
    return FileResponse(path, filename=fname)
