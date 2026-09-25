"""The marketing autopilot: what runs by itself, and when (India time)."""
from datetime import date, timedelta

from app.core.scheduler import module_job, register_job
from app.modules.m01_marketing import analytics, engagement, media, planner, publisher

CODE = "M01"


def plan_next_week(db) -> str:
    start = planner.week_start_for(date.today()) + timedelta(days=7)
    items = planner.plan_week(db, start)
    return f"{len(items)} items planned for week of {start}"


def plan_this_week_if_empty(db) -> str:
    items = planner.plan_week(db, planner.week_start_for(date.today()))
    return f"{len(items)} items planned"


def media_inbox(db) -> str:
    got = media.scan_drive(db)
    checked = media.check_new(db)
    return f"{got}; {checked} checked"


def refresh_tokens(db) -> str:
    from datetime import datetime, timezone

    from app.integrations import connections, instagram

    out = []
    if connections.get(db, "instagram"):
        try:
            out.append(instagram.refresh_token(db))
        except Exception as exc:
            connections.mark_error(db, "instagram", str(exc))
            publisher._notify_owner(db, f"⚠️ Instagram login problem: {exc}. Open Marketing → Connections.")
    li = connections.get(db, "linkedin")
    if li and li.expires_at:
        days = (li.expires_at - datetime.now(timezone.utc)).days
        if days <= 7:
            publisher._notify_owner(db, f"🔑 LinkedIn login expires in {max(days, 0)} days. "
                                        "Open Marketing → Connections → Connect LinkedIn.")
    return ", ".join(out) or "ok"


def register() -> None:
    register_job("m01_media_inbox", module_job(CODE, media_inbox), "interval", minutes=30)
    register_job("m01_plan_week", module_job(CODE, plan_next_week), "cron", day_of_week="sun", hour=18, minute=5)
    register_job("m01_plan_now", module_job(CODE, plan_this_week_if_empty), "interval", hours=6)
    register_job("m01_production", module_job(CODE, publisher.produce_due), "interval", minutes=20)
    register_job("m01_publish", module_job(CODE, publisher.publish_due), "interval", minutes=5)
    register_job("m01_engagement", module_job(CODE, engagement.poll), "interval", minutes=15)
    register_job("m01_analytics", module_job(CODE, analytics.collect), "cron", hour=23, minute=10)
    register_job("m01_weekly_report", module_job(CODE, analytics.weekly_report), "cron", day_of_week="mon",
                 hour=8, minute=50)
    register_job("m01_tokens", module_job(CODE, refresh_tokens), "cron", hour=3, minute=20)
