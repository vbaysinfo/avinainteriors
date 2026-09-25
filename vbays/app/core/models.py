"""Core database tables (Phase 1).

Money is always stored in PAISE (whole numbers): ₹1,250.50 → 125050.
Module tables (leads, quotations, jobs …) are added in later phases in each
module's own models.py.
"""
from datetime import datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, TimestampMixin

# ---------------------------------------------------------------------------
# People & security
# ---------------------------------------------------------------------------


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(200), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True)
    role: Mapped[str] = mapped_column(String(40), index=True)
    password_hash: Mapped[str | None] = mapped_column(String(300))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    telegram_username: Mapped[str | None] = mapped_column(String(80))
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    telegram_link_code: Mapped[str | None] = mapped_column(String(12))
    telegram_link_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)


class AuditLog(Base):
    """Who did what, when. Insert-only (the database refuses edits/deletes)."""

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    user_name: Mapped[str | None] = mapped_column(String(120))
    channel: Mapped[str] = mapped_column(String(20), default="web")  # web/telegram/system/mcp
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str | None] = mapped_column(String(60))
    entity_id: Mapped[str | None] = mapped_column(String(60))
    details: Mapped[dict | None] = mapped_column(JSON)
    ip: Mapped[str | None] = mapped_column(String(60))


# ---------------------------------------------------------------------------
# Approvals & outgoing messages
# ---------------------------------------------------------------------------


class Approval(TimestampMixin, Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)  # post/quotation/discount/po/template/payment_request/test
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text, default="")
    payload: Mapped[dict | None] = mapped_column(JSON)
    entity_type: Mapped[str | None] = mapped_column(String(60))
    entity_id: Mapped[str | None] = mapped_column(String(60))
    approver_role: Mapped[str] = mapped_column(String(40), default="owner")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending/approved/rejected/changes_requested
    requested_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    decided_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_note: Mapped[str | None] = mapped_column(Text)
    telegram_messages: Mapped[list | None] = mapped_column(JSON)  # [[chat_id, message_id], …]

    requested_by: Mapped[User | None] = relationship(foreign_keys=[requested_by_id])
    decided_by: Mapped[User | None] = relationship(foreign_keys=[decided_by_id])


class OutboxMessage(TimestampMixin, Base):
    """Every outgoing message. In test mode it stops here and is never sent."""

    __tablename__ = "outbox"

    id: Mapped[int] = mapped_column(primary_key=True)
    channel: Mapped[str] = mapped_column(String(20))  # telegram/whatsapp/instagram/youtube/email
    recipient: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict | None] = mapped_column(JSON)
    audience: Mapped[str] = mapped_column(String(20), default="staff")  # staff/customer/public
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)  # queued/sent/test/failed/blocked
    test_mode: Mapped[bool] = mapped_column(Boolean, default=True)
    approval_id: Mapped[int | None] = mapped_column(ForeignKey("approvals.id"))
    error: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


# ---------------------------------------------------------------------------
# Settings & modules
# ---------------------------------------------------------------------------


class Setting(TimestampMixin, Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")


class ModuleSwitch(TimestampMixin, Base):
    __tablename__ = "module_switches"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)  # M01…M13
    name: Mapped[str] = mapped_column(String(80))
    phase: Mapped[int] = mapped_column(Integer)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    test_mode: Mapped[bool] = mapped_column(Boolean, default=True)
    built: Mapped[bool] = mapped_column(Boolean, default=False)


# ---------------------------------------------------------------------------
# Customers & privacy (DPDP)
# ---------------------------------------------------------------------------


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20), unique=True)
    alt_phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(200))
    language_pref: Mapped[str | None] = mapped_column(String(10))
    address: Mapped[str | None] = mapped_column(Text)
    area: Mapped[str | None] = mapped_column(String(80))
    city: Mapped[str | None] = mapped_column(String(80))
    notes: Mapped[str | None] = mapped_column(Text)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)  # anonymised on request


class Consent(TimestampMixin, Base):
    __tablename__ = "consents"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    purpose: Mapped[str] = mapped_column(String(40))  # whatsapp_updates/marketing_media/testimonial/review_request
    given_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String(40))  # whatsapp/form/verbal/paper
    evidence: Mapped[str | None] = mapped_column(Text)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DataRequest(TimestampMixin, Base):
    __tablename__ = "data_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"))
    kind: Mapped[str] = mapped_column(String(20))  # delete/export/correct
    status: Mapped[str] = mapped_column(String(20), default="open")
    note: Mapped[str | None] = mapped_column(Text)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


# ---------------------------------------------------------------------------
# Files, knowledge, notifications, jobs
# ---------------------------------------------------------------------------


class FileRecord(TimestampMixin, Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str | None] = mapped_column(String(60))
    entity_id: Mapped[str | None] = mapped_column(String(60))
    path: Mapped[str | None] = mapped_column(String(500))
    drive_file_id: Mapped[str | None] = mapped_column(String(120))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    kind: Mapped[str] = mapped_column(String(40), default="photo")
    tags: Mapped[list | None] = mapped_column(JSON)
    uploaded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class KnowledgeDoc(TimestampMixin, Base):
    __tablename__ = "knowledge_docs"
    __table_args__ = (UniqueConstraint("name", "version"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), index=True)  # e.g. faq.md
    version: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    updated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class JobRun(Base):
    __tablename__ = "job_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_name: Mapped[str] = mapped_column(String(80), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ok: Mapped[bool | None] = mapped_column(Boolean)
    result: Mapped[str | None] = mapped_column(Text)


# ---------------------------------------------------------------------------
# Master data (imported from Excel/CSV in /master_data)
# ---------------------------------------------------------------------------


class RateCardItem(TimestampMixin, Base):
    __tablename__ = "rate_card_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_code: Mapped[str] = mapped_column(String(40), unique=True)
    item_name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(60))
    unit: Mapped[str] = mapped_column(String(20))  # sqft / rft / nos / set
    basic_rate_paise: Mapped[int] = mapped_column(BigInteger)
    premium_rate_paise: Mapped[int] = mapped_column(BigInteger)
    luxury_rate_paise: Mapped[int] = mapped_column(BigInteger)
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2))
    notes: Mapped[str | None] = mapped_column(Text)


class Material(TimestampMixin, Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(40))  # board/laminate/acrylic/pu/edge_band/adhesive/other
    brand: Mapped[str | None] = mapped_column(String(80))
    thickness_mm: Mapped[float | None] = mapped_column(Numeric(6, 2))
    sheet_length_mm: Mapped[int | None] = mapped_column(Integer)
    sheet_width_mm: Mapped[int | None] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(20))
    cost_rate_paise: Mapped[int] = mapped_column(BigInteger)
    sell_rate_paise: Mapped[int | None] = mapped_column(BigInteger)


class HardwareItem(TimestampMixin, Base):
    __tablename__ = "hardware_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    brand: Mapped[str | None] = mapped_column(String(80))
    type: Mapped[str] = mapped_column(String(40))
    unit: Mapped[str] = mapped_column(String(20))
    cost_rate_paise: Mapped[int] = mapped_column(BigInteger)
    sell_rate_paise: Mapped[int | None] = mapped_column(BigInteger)


class ProductCatalogItem(TimestampMixin, Base):
    __tablename__ = "product_catalog"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(60))
    std_width_mm: Mapped[int | None] = mapped_column(Integer)
    std_height_mm: Mapped[int | None] = mapped_column(Integer)
    std_depth_mm: Mapped[int | None] = mapped_column(Integer)
    default_board_code: Mapped[str | None] = mapped_column(String(40))
    default_finish_code: Mapped[str | None] = mapped_column(String(40))
    default_hardware: Mapped[str | None] = mapped_column(Text)  # "HNG-SC:4;CHN-450:2"


class Vendor(TimestampMixin, Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    contact_person: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(200))
    gstin: Mapped[str | None] = mapped_column(String(20))
    items_supplied: Mapped[str | None] = mapped_column(Text)
    payment_terms: Mapped[str | None] = mapped_column(String(120))


class ProductionStage(TimestampMixin, Base):
    __tablename__ = "production_stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    sequence: Mapped[int] = mapped_column(Integer, unique=True)
    name: Mapped[str] = mapped_column(String(80))
    planned_hours: Mapped[float] = mapped_column(Numeric(6, 2))
    needs_photo: Mapped[bool] = mapped_column(Boolean, default=True)
    needs_qc: Mapped[bool] = mapped_column(Boolean, default=False)


class PaymentMilestoneTemplate(TimestampMixin, Base):
    __tablename__ = "payment_milestone_templates"
    __table_args__ = (UniqueConstraint("template_name", "sequence"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    template_name: Mapped[str] = mapped_column(String(80))
    sequence: Mapped[int] = mapped_column(Integer)
    milestone_name: Mapped[str] = mapped_column(String(120))
    percent: Mapped[float] = mapped_column(Numeric(5, 2))
    trigger: Mapped[str] = mapped_column(String(40))


class MessageTemplate(TimestampMixin, Base):
    __tablename__ = "message_templates"
    __table_args__ = (UniqueConstraint("name", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    language: Mapped[str] = mapped_column(String(10))  # te / en / te-en
    category: Mapped[str] = mapped_column(String(20))  # utility / marketing / authentication
    body: Mapped[str] = mapped_column(Text)
    meta_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    owner_approved: Mapped[bool] = mapped_column(Boolean, default=False)
