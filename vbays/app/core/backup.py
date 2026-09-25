"""Daily database backup (pg_dump), keeping the last N days."""
import gzip
import logging
import os
import shutil
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy.engine import make_url

from app.config import get_settings

log = logging.getLogger(__name__)


def _pg_env_and_args() -> tuple[dict, list[str]]:
    url = make_url(get_settings().database_url)
    env = os.environ.copy()
    if url.password:
        env["PGPASSWORD"] = url.password
    args = ["-h", url.host or "localhost", "-p", str(url.port or 5432), "-U", url.username or "postgres", url.database]
    return env, args


def run_backup() -> Path:
    """Create backups/vbays-YYYYmmdd-HHMMSS.sql.gz and delete old ones."""
    s = get_settings()
    s.backup_dir.mkdir(parents=True, exist_ok=True)
    if not shutil.which("pg_dump"):
        raise RuntimeError("pg_dump is not installed. Install the PostgreSQL client tools.")
    env, args = _pg_env_and_args()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    target = s.backup_dir / f"vbays-{stamp}.sql.gz"
    proc = subprocess.run(
        ["pg_dump", "--no-owner", "--no-privileges", *args], env=env, capture_output=True, check=False
    )
    if proc.returncode != 0:
        raise RuntimeError(f"pg_dump failed: {proc.stderr.decode(errors='replace')[:500]}")
    with gzip.open(target, "wb") as f:
        f.write(proc.stdout)
    prune_old_backups()
    log.info("Backup written to %s", target)
    return target


def prune_old_backups() -> int:
    s = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(days=s.backup_keep_days)
    removed = 0
    for f in s.backup_dir.glob("vbays-*.sql.gz"):
        if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < cutoff:
            f.unlink()
            removed += 1
    return removed


def list_backups() -> list[Path]:
    d = get_settings().backup_dir
    return sorted(d.glob("vbays-*.sql.gz"), reverse=True) if d.exists() else []
