"""
Guardian-Link — Authentication & Authorization Dependencies
────────────────────────────────────────────────────────────
This module provides FastAPI Depends() functions for:
  1. get_current_user  → Decodes JWT, returns the user dict from DB
  2. require_admin     → Ensures the current user has role "Admin"
  3. require_user      → Ensures the current user has role "User"

Usage in routes:
  @router.get("/profile")
  async def profile(current_user: dict = Depends(get_current_user)):
      ...

  @router.get("/all-users")
  async def all_users(current_user: dict = Depends(require_admin)):
      ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.utils import serialize_doc

# ──────────────────────────────────────────────
# Security Scheme — expects "Authorization: Bearer <token>"
# ──────────────────────────────────────────────
security = HTTPBearer()


# ──────────────────────────────────────────────
# 1. get_current_user — Decode JWT & fetch user from DB
# ──────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency that extracts the JWT from the Authorization header,
    decodes it, and returns the full user document from MongoDB.

    Raises:
        401 — If the token is missing, expired, or invalid
        401 — If the user no longer exists in the database
    """
    token = credentials.credentials

    # --- Decode JWT ---
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # --- Fetch user from DB ---
    db = get_db()
    user = await db.users.find_one({"email": email})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found — account may have been deleted",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = serialize_doc(user)
    user_data.pop("password", None)
    if "preferences" not in user_data:
        user_data["preferences"] = {
            "push_notifications": True,
            "email_notifications": True,
            "match_alerts": True,
        }
    if "email_verified" not in user_data:
        user_data["email_verified"] = False
    return user_data


# ──────────────────────────────────────────────
# 2. require_admin — Only allow role == "Admin"
# ──────────────────────────────────────────────
async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that ensures the authenticated user has the "Admin" role.

    Raises:
        403 — If the user is not an Admin
    """
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required",
        )
    return current_user


# ──────────────────────────────────────────────
# 3. require_user — Only allow role == "User"
#    (rarely needed, but provided for completeness)
# ──────────────────────────────────────────────
async def require_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that ensures the authenticated user has the "User" role.

    Raises:
        403 — If the user is not a regular User
    """
    if current_user.get("role") != "User":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: User role required",
        )
    return current_user
