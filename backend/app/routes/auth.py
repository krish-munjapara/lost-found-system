"""
Guardian-Link Auth Routes
─────────────────────────
Handles user registration, login, JWT token creation,
and the protected /me endpoint.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from app.database import get_db
from app.models import UserRegister, UserLogin, TokenResponse
from app.utils import get_timestamp
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict) -> str:
    """Create a JWT access token with email + role in payload."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ──────────────────────────────────────────────
# REGISTER
# ──────────────────────────────────────────────
@router.post("/register")
async def register(user: UserRegister):
    db = get_db()

    # Check existing user
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # 🔥 FIX: bcrypt 72 limit
    if len(user.password) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password too long (max 72 characters)"
        )

    hashed_password = pwd_context.hash(user.password)

    user_doc = {
        "full_name": user.full_name,
        "email": user.email,
        "password": hashed_password,
        "mobile": user.mobile,
        "gender": user.gender,
        "address": user.address,
        "role": "User",
        "created_at": get_timestamp()
    }

    await db.users.insert_one(user_doc)

    return {
        "success": True,
        "message": "User registered successfully"
    }


# ──────────────────────────────────────────────
# LOGIN
# ──────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 🔥 FIX: bcrypt safe verify
    password = credentials.password[:72]

    if not pwd_context.verify(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT
    token = create_access_token({
        "sub": user["email"],
        "role": user.get("role", "User")
    })

    return TokenResponse(
        access_token=token,
        role=user.get("role", "User"),
        user_name=user.get("full_name", "")
    )


# ──────────────────────────────────────────────
# CURRENT USER (/me)
# ──────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user
    }