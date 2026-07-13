"""Token generation and validation helpers."""

import hashlib
import secrets
from datetime import datetime, timedelta

from jose import jwt

from app.config import (
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    EMAIL_VERIFY_EXPIRE_HOURS,
    PASSWORD_RESET_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
)
from app.database import get_db
from app.utils import get_timestamp


def create_access_token(email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "role": role, "exp": expire, "type": "access"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_refresh_token(email: str) -> str:
    token = secrets.token_urlsafe(48)
    expires = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db = get_db()
    await db.refresh_tokens.insert_one({
        "email": email,
        "token_hash": _hash_token(token),
        "expires_at": expires,
        "created_at": get_timestamp(),
    })
    return token


async def verify_refresh_token(token: str) -> str | None:
    db = get_db()
    doc = await db.refresh_tokens.find_one({"token_hash": _hash_token(token)})
    if not doc:
        return None
    if doc.get("expires_at") and doc["expires_at"] < datetime.utcnow():
        await db.refresh_tokens.delete_one({"_id": doc["_id"]})
        return None
    return doc["email"]


async def revoke_refresh_token(token: str) -> None:
    db = get_db()
    await db.refresh_tokens.delete_one({"token_hash": _hash_token(token)})


async def revoke_all_refresh_tokens(email: str) -> None:
    db = get_db()
    await db.refresh_tokens.delete_many({"email": email})


async def create_password_reset_token(email: str) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
    db = get_db()
    await db.password_reset_tokens.delete_many({"email": email})
    await db.password_reset_tokens.insert_one({
        "email": email,
        "token_hash": _hash_token(token),
        "expires_at": expires,
        "created_at": get_timestamp(),
    })
    return token


async def verify_password_reset_token(token: str) -> str | None:
    db = get_db()
    doc = await db.password_reset_tokens.find_one({"token_hash": _hash_token(token)})
    if not doc:
        return None
    if doc.get("expires_at") and doc["expires_at"] < datetime.utcnow():
        return None
    return doc["email"]


async def consume_password_reset_token(token: str) -> None:
    db = get_db()
    await db.password_reset_tokens.delete_one({"token_hash": _hash_token(token)})


async def create_email_verification_token(email: str) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS)
    db = get_db()
    await db.email_verification_tokens.delete_many({"email": email})
    await db.email_verification_tokens.insert_one({
        "email": email,
        "token_hash": _hash_token(token),
        "expires_at": expires,
        "created_at": get_timestamp(),
    })
    return token


async def verify_email_token(token: str) -> str | None:
    db = get_db()
    doc = await db.email_verification_tokens.find_one({"token_hash": _hash_token(token)})
    if not doc:
        return None
    if doc.get("expires_at") and doc["expires_at"] < datetime.utcnow():
        return None
    return doc["email"]


async def consume_email_verification_token(token: str) -> None:
    db = get_db()
    await db.email_verification_tokens.delete_one({"token_hash": _hash_token(token)})
