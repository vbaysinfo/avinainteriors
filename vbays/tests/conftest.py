"""Test setup: every test run uses a brand-new, throw-away schema in the
TEST database (never your real data). Set TEST_DATABASE_URL to change it."""
import os
import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_URL = os.environ.get("TEST_DATABASE_URL", "postgresql+psycopg://vbays:vbays@localhost:5432/vbays_test")
SCHEMA = f"t_{uuid.uuid4().hex[:10]}"

os.environ["DATABASE_URL"] = TEST_URL
os.environ["TEST_MODE"] = "true"
os.environ["TELEGRAM_ENABLED"] = "false"
os.environ["TELEGRAM_BOT_TOKEN"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["SCHEDULER_ENABLED"] = "false"
os.environ["SECRET_KEY"] = "test-secret"

from app.config import get_settings  # noqa: E402

get_settings.cache_clear()

from app.core import db as dbmod  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def database(tmp_path_factory):
    admin = create_engine(TEST_URL)
    with admin.begin() as c:
        c.execute(text(f'CREATE SCHEMA "{SCHEMA}"'))
    engine = create_engine(TEST_URL, connect_args={"options": f"-csearch_path={SCHEMA}"})
    dbmod._engine = engine
    dbmod._SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    s = get_settings()
    s.backup_dir = tmp_path_factory.mktemp("backups")
    s.storage_dir = tmp_path_factory.mktemp("storage")
    kdir = tmp_path_factory.mktemp("knowledge")
    for f in s.knowledge_dir.glob("*.md"):
        (kdir / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")
    s.knowledge_dir = kdir

    from app.core.setup import init_db

    init_db()
    yield engine
    engine.dispose()
    with admin.begin() as c:
        c.execute(text(f'DROP SCHEMA "{SCHEMA}" CASCADE'))
    admin.dispose()


@pytest.fixture
def db():
    with dbmod.session_scope() as s:
        yield s


def make_user(db, role="owner", **kw):
    from app.core.auth import hash_password
    from app.core.models import User

    n = uuid.uuid4().hex[:8]
    u = User(name=kw.get("name", f"{role}-{n}"), role=role, email=kw.get("email", f"{n}@test.local"),
             password_hash=hash_password(kw.get("password", "Passw0rd!")), telegram_chat_id=kw.get("chat_id"))
    db.add(u)
    db.flush()
    return u
