"""Password hashing and verification utilities.

This module intentionally avoids Passlib's bcrypt integration because the
runtime environment on Render has shown compatibility issues with bcrypt
and Passlib combinations. It provides a stable wrapper around the
standard bcrypt package and supports passwords longer than bcrypt's
72-byte limit by hashing the UTF-8 bytes of the password with a
prefix and a per-hash salt.
"""

from __future__ import annotations

import hashlib
from typing import Final

import bcrypt

_BCRYPT_LOG_ROUNDS: Final[int] = 12


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    bcrypt has a 72-byte password limit, so we encode the password as UTF-8
    and hash the full bytes with a SHA-256 digest first. The resulting digest
    is then passed to bcrypt, preserving compatibility with the existing
    application semantics while avoiding the native length limit.
    """
    if not isinstance(password, str):
        raise TypeError("password must be a string")

    normalized = password.encode("utf-8")
    if len(normalized) > 72:
        normalized = hashlib.sha256(normalized).digest()

    salt = bcrypt.gensalt(rounds=_BCRYPT_LOG_ROUNDS)
    hashed = bcrypt.hashpw(normalized, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a stored hash.

    Supports both the new digest-based hashing strategy for passwords longer
    than bcrypt's 72-byte limit and the legacy truncated-password hashes that
    may already exist in the database.
    """
    if not isinstance(password, str) or not isinstance(password_hash, str):
        return False

    encoded = password.encode("utf-8")
    candidates = [encoded]

    if len(encoded) > 72:
        candidates.append(hashlib.sha256(encoded).digest())

    if len(encoded) > 72:
        candidates.append(encoded[:72])
    else:
        candidates.append(encoded[:72])

    try:
        for candidate in candidates:
            if bcrypt.checkpw(candidate, password_hash.encode("utf-8")):
                return True
    except (ValueError, TypeError):
        return False

    return False
