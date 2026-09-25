"""Scheduled jobs (backups now; reminders and daily summaries in later phases)."""
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import get_settings
from app.core import backup
from app.core.db import session_scope
from app.core.models import JobRun

log = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def run_job(name: str, fn) -> None:
    """Run a job and record the result in job_runs (visible in the admin website)."""
    started = datetime.now(timezone.utc)
    ok, result = True, "ok"
    try:
        out = fn()
        result = str(out) if out is not None else "ok"
    except Exception as exc:
        log.exception("Job %s failed", name)
        ok, result = False, str(exc)[:1000]
    with session_scope() as db:
        db.add(JobRun(job_name=name, started_at=started, finished_at=datetime.now(timezone.utc), ok=ok, result=result))


def start() -> BackgroundScheduler:
    global _scheduler
    s = get_settings()
    _scheduler = BackgroundScheduler(timezone=s.timezone)
    _scheduler.add_job(
        run_job, "cron", hour=s.backup_hour, minute=0, args=["daily_backup", backup.run_backup], id="daily_backup",
        replace_existing=True, misfire_grace_time=3600,
    )
    _scheduler.start()
    log.info("Scheduler started")
    return _scheduler


def shutdown() -> None:
    if _scheduler:
        _scheduler.shutdown(wait=False)
