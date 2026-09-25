"""All settings for Vbays, read from the .env file.

Nothing secret is written in code. Copy `.env.example` to `.env` and fill it in.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # --- Identity ---
    app_name: str = "Vbays"
    company_name: str = "Avina Interiors"
    timezone: str = "Asia/Kolkata"
    default_language: str = "te-en"  # te | en | te-en (Telugu-English mix)

    # --- Safety ---
    # When true, NOTHING is sent to real customers or platforms. Every outgoing
    # message is written to the Outbox screen instead.
    test_mode: bool = True

    # --- Web / security ---
    secret_key: str = "change-me"  # used to sign login cookies
    session_max_age_hours: int = 12
    base_url: str = "http://localhost:8000"

    # --- Database ---
    database_url: str = "postgresql+psycopg://vbays:vbays@localhost:5432/vbays"

    # --- Claude (Anthropic) ---
    anthropic_api_key: str = ""
    claude_model: str = "claude-opus-5"

    # --- Telegram (staff/owner channel) ---
    telegram_bot_token: str = ""
    telegram_enabled: bool = False  # start the bot inside the app

    # --- Backups ---
    backup_dir: Path = BASE_DIR / "backups"
    backup_keep_days: int = 14
    backup_hour: int = 2  # 2 AM, local time

    # --- Folders ---
    storage_dir: Path = BASE_DIR / "storage"
    knowledge_dir: Path = BASE_DIR / "knowledge"
    master_data_dir: Path = BASE_DIR / "master_data"
    log_dir: Path = BASE_DIR / "logs"

    # --- Scheduler ---
    scheduler_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
