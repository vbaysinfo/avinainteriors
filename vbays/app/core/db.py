"""Database connection. One PostgreSQL database is shared by every module."""
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone

from sqlalchemy import DateTime, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


_engine = None
_SessionLocal: sessionmaker | None = None


def get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine


def reset_engine(url: str | None = None) -> None:
    """Point the app at a different database (used by tests)."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = create_engine(url or get_settings().database_url, pool_pre_ping=True)
    _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Open a session, commit on success, roll back on error."""
    get_engine()
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Iterator[Session]:
    """FastAPI dependency."""
    with session_scope() as s:
        yield s


def create_all() -> None:
    # Import models so they register on Base.metadata
    from app.core import models  # noqa: F401
    from app.modules.m01_marketing import models as _m01  # noqa: F401

    Base.metadata.create_all(get_engine())
