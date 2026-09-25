"""Vbays: start here.  Run:  uvicorn app.main:app

On start-up it creates/updates the database tables, starts the daily-backup
scheduler and (if configured) the Telegram bot.
"""
import importlib
import logging
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.core import scheduler
from app.core.auth import LoginRequired
from app.core.setup import init_db
from app.integrations import telegram_bot
from app.modules import MODULES
from app.web.common import redirect, render
from app.web.routes import router


def setup_logging() -> None:
    s = get_settings()
    s.log_dir.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(s.log_dir / "vbays.log", maxBytes=5_000_000, backupCount=10, encoding="utf-8")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[handler, logging.StreamHandler()],
    )


def check_settings() -> None:
    s = get_settings()
    if not s.test_mode and s.secret_key in ("", "change-me"):
        raise RuntimeError("Set a long random SECRET_KEY in .env before turning test mode off.")


def load_modules(app: FastAPI) -> None:
    """Load every built module. Each module checks its ON/OFF switch while it runs,
    so switching a module on or off works immediately, without a restart."""
    for info in MODULES:
        if info.built and info.package:
            importlib.import_module(info.package).register(app)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    check_settings()
    init_db()
    telegram_bot.register()
    if get_settings().scheduler_enabled:
        scheduler.start()
    await telegram_bot.start_polling()
    yield
    await telegram_bot.stop_polling()
    scheduler.shutdown()


def create_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(title=s.app_name, lifespan=lifespan, docs_url=None, redoc_url=None)
    app.add_middleware(
        SessionMiddleware,
        secret_key=s.secret_key,
        session_cookie="vbays_session",
        max_age=s.session_max_age_hours * 3600,
        same_site="lax",
        https_only=s.base_url.startswith("https://"),
    )
    app.mount("/static", StaticFiles(directory=Path(__file__).parent / "web" / "static"), name="static")
    app.include_router(router)
    load_modules(app)

    @app.exception_handler(LoginRequired)
    async def _login_required(request: Request, exc: LoginRequired):
        return redirect("/login")

    @app.exception_handler(HTTPException)
    async def _http_error(request: Request, exc: HTTPException):
        resp = render(request, "error.html", None, code=exc.status_code, message=exc.detail)
        resp.status_code = exc.status_code
        return resp

    @app.get("/health")
    def health():
        return {"ok": True, "app": s.app_name, "test_mode": s.test_mode}

    return app


app = create_app()
