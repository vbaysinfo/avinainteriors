"""Daily stats + weekly report (Telegram) + insights that feed next week's plan."""
import json
import logging
from datetime import date, datetime, timedelta, timezone

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import ai
from app.core.models import Lead, Setting
from app.modules.m01_marketing.models import AnalyticsSnapshot, ContentItem, SocialComment, SocialPost
from app.modules.m01_marketing.publisher import _notify_owner

log = logging.getLogger(__name__)


def collect(db: Session) -> str:
    from app.integrations import connections, google, instagram

    today = date.today()
    done = []
    if connections.get(db, "instagram"):
        try:
            st = instagram.account_stats(db)
            _snap(db, today, "instagram", st.get("followers_count"), st)
            for p in _recent_posts(db, "instagram"):
                p.metrics, p.metrics_at = instagram.media_stats(db, p.remote_id), datetime.now(timezone.utc)
            done.append("instagram")
        except Exception as exc:
            log.warning("Instagram stats failed: %s", exc)
    if connections.get(db, "google"):
        try:
            st = google.channel_stats(db)
            _snap(db, today, "youtube", int(st.get("subscriberCount") or 0), st)
            posts = _recent_posts(db, "youtube")
            stats = google.video_stats(db, [p.remote_id for p in posts])
            for p in posts:
                p.metrics, p.metrics_at = stats.get(p.remote_id), datetime.now(timezone.utc)
            done.append("youtube")
        except Exception as exc:
            log.warning("YouTube stats failed: %s", exc)
    return ", ".join(done) or "no platforms connected"


def _snap(db: Session, day: date, platform: str, followers, data: dict) -> None:
    s = db.scalar(select(AnalyticsSnapshot).where(AnalyticsSnapshot.day == day, AnalyticsSnapshot.platform == platform))
    if not s:
        s = AnalyticsSnapshot(day=day, platform=platform)
        db.add(s)
    s.followers, s.data = followers, data


def _recent_posts(db: Session, platform: str, days: int = 30) -> list[SocialPost]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return list(db.scalars(select(SocialPost).where(SocialPost.platform == platform, SocialPost.status == "published",
                                                    SocialPost.published_at >= since)))


def _num(m: dict | None, *keys) -> int:
    m = m or {}
    for k in keys:
        if m.get(k) is not None:
            try:
                return int(m[k])
            except (TypeError, ValueError):
                pass
    return 0


class Insights(BaseModel):
    summary: str
    what_worked: list[str]
    what_to_change: list[str]
    ideas_next_week: list[str]


def weekly_report(db: Session) -> str:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    posts = list(db.scalars(select(SocialPost).where(SocialPost.published_at >= since,
                                                    SocialPost.status.in_(["published", "test"]))))
    rows = []
    for p in posts:
        item = db.get(ContentItem, p.content_item_id)
        rows.append({"platform": p.platform, "format": item.format, "template": item.template, "topic": item.topic,
                     "time": p.published_at.isoformat() if p.published_at else None,
                     "likes": _num(p.metrics, "like_count", "likeCount"),
                     "comments": _num(p.metrics, "comments_count", "commentCount"),
                     "views": _num(p.metrics, "viewCount")})
    leads = db.scalar(select(func.count()).select_from(Lead).where(Lead.created_at >= since)) or 0
    by_source = dict(db.execute(select(Lead.source, func.count()).where(Lead.created_at >= since)
                                .group_by(Lead.source)).all())
    comments = db.scalar(select(func.count()).select_from(SocialComment).where(SocialComment.received_at >= since)) or 0
    handover = db.scalar(select(func.count()).select_from(SocialComment).where(
        SocialComment.received_at >= since, SocialComment.reply_status == "handover")) or 0
    followers = {s.platform: s.followers for s in db.scalars(
        select(AnalyticsSnapshot).order_by(AnalyticsSnapshot.day.desc()).limit(4))}

    text = (f"📊 Weekly marketing report\n\nPosts: {len(posts)}\nComments/DMs: {comments} "
            f"(needed a person: {handover})\nNew leads: {leads} {by_source or ''}\n"
            f"Followers: {followers or 'not connected yet'}")
    try:
        ins: Insights = ai.ask_json(db, "Here is last week's social media data for our interior business. Write "
                                        "simple insights for the owner (plain English, short).\n"
                                    + json.dumps({"posts": rows, "leads": leads, "leads_by_source": by_source,
                                                  "comments": comments, "followers": followers}, default=str),
                                    Insights, max_tokens=3000)
        text += f"\n\n{ins.summary}\n✅ " + "\n✅ ".join(ins.what_worked[:3]) + "\n🔧 " + \
                "\n🔧 ".join(ins.what_to_change[:3])
        insight_text = json.dumps(ins.model_dump(), ensure_ascii=False)
    except ai.AIUnavailable:
        best = sorted(rows, key=lambda r: -(r["likes"] + 3 * r["comments"] + r["views"] // 20))[:3]
        if best:
            text += "\n\nTop posts:\n" + "\n".join(f"• {r['platform']} {r['format']}: {r['topic'][:50]}" for r in best)
        insight_text = json.dumps({"top_posts": best}, ensure_ascii=False, default=str)
    s = db.get(Setting, "marketing_insights") or Setting(key="marketing_insights", value="",
                                                           description="Latest weekly insights (used by planner)")
    s.value = insight_text[:8000]
    db.add(s)
    _notify_owner(db, text)
    return text
