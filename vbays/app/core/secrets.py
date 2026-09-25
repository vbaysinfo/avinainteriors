"""Encrypt platform tokens before saving them in the database.

The key is derived from SECRET_KEY in .env. If you change SECRET_KEY, saved
connections can't be read any more: reconnect them on the Connections page.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


def _fernet() -> Fernet:
    key = hashlib.sha256(("vbays-tokens:" + get_settings().secret_key).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt(value: str | None) -> str | None:
    if not value:
        return None
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        return None
