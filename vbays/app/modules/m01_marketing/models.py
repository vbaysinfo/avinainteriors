"""Marketing tables (Module M01)."""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin


class MediaAsset(TimestampMixin, Base):
    """A real photo or video of our work (from Google Drive or Telegram)."""

    __tablename__ = "media_assets"
    __table_args__ = (UniqueConstraint("source", "source_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(20))  # drive / telegram / upload / testimonial
    source_id: Mapped[str] = mapped_column(String(200))
    filename: Mapped[str] = mapped_column(String(300))
    path: Mapped[str] = mapped_column(String(500))  # relative to STORAGE_DIR
    kind: Mapped[str] = mapped_column(String(10))  # photo / video
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    duration: Mapped[float | None] = mapped_column(Float)
    project_name: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)  # new / ok / rejected
    room_type: Mapped[str | None] = mapped_column(String(40))
    style: Mapped[str | None] = mapped_column(String(40))
    stage: Mapped[str | None] = mapped_column(String(20))  # before / during / after / factory
    quality_score: Mapped[int | None] = mapped_column(Integer)  # 1-10
    description: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list | None] = mapped_column(JSON)
    reject_reason: Mapped[str | None] = mapped_column(Text)
    has_people: Mapped[bool] = mapped_column(Boolean, default=False)
    has_private_info: Mapped[bool] = mapped_column(Boolean, default=False)  # house number, name board, car plate
    consent_ok: Mapped[bool] = mapped_column(Boolean, default=False)
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    uploaded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class ContentItem(TimestampMixin, Base):
    """One planned piece of content (can go to several platforms)."""

    __tablename__ = "content_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    week_start: Mapped[date] = mapped_column(Date, index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    template: Mapped[str] = mapped_column(String(30))
    format: Mapped[str] = mapped_column(String(20))  # reel / carousel / post / long_video / linkedin_post
    topic: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(10))
    platforms: Mapped[list] = mapped_column(JSON)  # ["instagram","youtube","linkedin"]
    media_ids: Mapped[list | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    package: Mapped[dict | None] = mapped_column(JSON)  # hook, scenes, caption, hashtags, youtube, linkedin …
    check: Mapped[dict | None] = mapped_column(JSON)  # AI fact-check result
    status: Mapped[str] = mapped_column(String(20), default="planned", index=True)
    # planned → written → rendered → scheduled → published   (or needs_review / failed / rejected / paused)
    video_path: Mapped[str | None] = mapped_column(String(500))  # 9:16
    video_landscape_path: Mapped[str | None] = mapped_column(String(500))  # 16:9
    image_paths: Mapped[list | None] = mapped_column(JSON)  # carousel / post images
    thumbnail_path: Mapped[str | None] = mapped_column(String(500))
    subtitles_path: Mapped[str | None] = mapped_column(String(500))
    error: Mapped[str | None] = mapped_column(Text)


class SocialPost(TimestampMixin, Base):
    """One content item on one platform."""

    __tablename__ = "social_posts"
    __table_args__ = (UniqueConstraint("content_item_id", "platform"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    content_item_id: Mapped[int] = mapped_column(ForeignKey("content_items.id"), index=True)
    platform: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="waiting", index=True)
    # waiting (content not ready) / scheduled / awaiting_approval / published / test / failed / rejected / paused
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    remote_id: Mapped[str | None] = mapped_column(String(200))
    permalink: Mapped[str | None] = mapped_column(String(500))
    approval_id: Mapped[int | None] = mapped_column(ForeignKey("approvals.id"))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text)
    metrics: Mapped[dict | None] = mapped_column(JSON)
    metrics_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SocialComment(TimestampMixin, Base):
    """A comment or direct message we received."""

    __tablename__ = "social_comments"
    __table_args__ = (UniqueConstraint("platform", "remote_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(20))
    kind: Mapped[str] = mapped_column(String(10), default="comment")  # comment / dm
    remote_id: Mapped[str] = mapped_column(String(200))
    thread_id: Mapped[str | None] = mapped_column(String(200))  # media id / video id / DM user id
    social_post_id: Mapped[int | None] = mapped_column(ForeignKey("social_posts.id"))
    author_name: Mapped[str | None] = mapped_column(String(200))
    author_id: Mapped[str | None] = mapped_column(String(200))
    text: Mapped[str] = mapped_column(Text)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    intent: Mapped[str | None] = mapped_column(String(20))  # enquiry / question / praise / complaint / negotiation / spam / other
    is_lead: Mapped[bool] = mapped_column(Boolean, default=False)
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id"))
    reply_text: Mapped[str | None] = mapped_column(Text)
    reply_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/sent/test/handover/skipped/failed
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AnalyticsSnapshot(TimestampMixin, Base):
    __tablename__ = "analytics_snapshots"
    __table_args__ = (UniqueConstraint("day", "platform"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    day: Mapped[date] = mapped_column(Date)
    platform: Mapped[str] = mapped_column(String(20))
    followers: Mapped[int | None] = mapped_column(Integer)
    data: Mapped[dict | None] = mapped_column(JSON)
