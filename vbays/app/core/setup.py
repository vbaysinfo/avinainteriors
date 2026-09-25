"""First-time setup: create tables, default settings, module list, knowledge."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core import audit, knowledge
from app.core.auth import hash_password
from app.core.db import create_all, session_scope
from app.core.masterdata import DATASETS, apply, preview, read_table
from app.core.models import ModuleSwitch, Setting, User
from app.modules import MODULES

DEFAULT_SETTINGS: dict[str, tuple[str, str]] = {
    "business_phone": ("", "Main phone / WhatsApp number shown to customers"),
    "service_areas": (
        "Visakhapatnam, MVP Colony, Madhurawada, Rushikonda, Gajuwaka, Siripuram, Seethammadhara, Rajahmundry, Vizianagaram",
        "Areas we serve (comma separated)",
    ),
    "discount_owner_approval_percent": ("5", "Discounts above this % need the owner's approval"),
    "quotation_validity_days": ("15", "How long a quotation is valid"),
    "gst_default_percent": ("18", "Default GST % (confirm with your CA)"),
    "working_hours": ("Mon–Sat 10:00–20:00", "Office hours (used for replies and reminders)"),
    "morning_summary_time": ("08:00", "Time for the daily owner summary (Phase 8)"),
    "auto_publish_marketing": ("off", "on = approved posts publish automatically at their scheduled time"),
}


def seed_defaults(db: Session) -> None:
    for code_info in MODULES:
        if db.get(ModuleSwitch, code_info.code) is None:
            db.add(ModuleSwitch(code=code_info.code, name=code_info.name, phase=code_info.phase,
                                enabled=False, test_mode=True, built=code_info.built))
        else:
            sw = db.get(ModuleSwitch, code_info.code)
            sw.name, sw.phase, sw.built = code_info.name, code_info.phase, code_info.built
    for key, (value, desc) in DEFAULT_SETTINGS.items():
        if db.get(Setting, key) is None:
            db.add(Setting(key=key, value=value, description=desc))
    knowledge.seed_from_disk(db)


def init_db() -> None:
    create_all()
    with session_scope() as db:
        audit.protect_audit_table(db)
        seed_defaults(db)


def create_owner(db: Session, name: str, email: str, password: str, phone: str | None = None) -> User:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(name=name, email=email, phone=phone, role="owner")
        db.add(user)
    user.role, user.is_active, user.failed_logins = "owner", True, 0
    user.password_hash = hash_password(password)
    db.flush()
    audit.log(db, "user.owner_created", None, "user", user.id, {"email": email}, channel="system")
    return user


def import_folder(db: Session, folder=None) -> dict[str, str]:
    """Import every master_data/<dataset>.csv that exists. Used for the demo."""
    folder = folder or get_settings().master_data_dir
    report = {}
    for key, ds in DATASETS.items():
        path = folder / ds.filename
        if not path.exists():
            continue
        res = preview(db, ds, read_table(path.name, path.read_bytes()))
        if res.errors:
            report[key] = "ERRORS: " + "; ".join(res.errors[:5])
            continue
        added, updated = apply(db, ds, res)
        audit.log(db, "masterdata.imported", None, "dataset", key, {"added": added, "updated": updated}, "system")
        report[key] = f"{added} added, {updated} updated"
    return report
