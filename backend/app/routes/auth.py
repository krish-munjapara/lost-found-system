"""
Guardian-Link Auth Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from passlib.context import CryptContext

from app.database import get_db
from app.models.user_model import (
    UserRegister, UserLogin, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    RefreshTokenRequest, ChangePasswordRequest,
)
from app.utils import get_timestamp, serialize_doc
from app.utils.tokens import (
    create_access_token, create_refresh_token, verify_refresh_token,
    revoke_refresh_token, revoke_all_refresh_tokens,
    create_password_reset_token, verify_password_reset_token, consume_password_reset_token,
    create_email_verification_token, verify_email_token, consume_email_verification_token,
)
from app.services.email_service import send_password_reset_email, send_verification_email
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _default_preferences():
    return {"push_notifications": True, "email_notifications": True, "match_alerts": True}


async def _build_token_response(user: dict) -> TokenResponse:
    email = user["email"]
    access = create_access_token(email, user.get("role", "User"))
    refresh = await create_refresh_token(email)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=user.get("role", "User"),
        user_name=user.get("full_name", ""),
        email=email,
        email_verified=user.get("email_verified", False),
    )


@router.post("/register")
async def register(user: UserRegister):
    db = get_db()
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_doc = {
        "full_name": user.full_name,
        "email": user.email,
        "password": pwd_context.hash(user.password[:72]),
        "mobile": user.mobile,
        "gender": user.gender,
        "address": user.address,
        "role": "User",
        "email_verified": False,
        "preferences": _default_preferences(),
        "created_at": get_timestamp(),
    }
    await db.users.insert_one(user_doc)

    token = await create_email_verification_token(user.email)
    send_verification_email(user.email, token)

    return {"success": True, "message": "Registered successfully. Please verify your email."}


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": credentials.email})
    if not user or not pwd_context.verify(credentials.password[:72], user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return await _build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest):
    email = await verify_refresh_token(body.refresh_token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    await revoke_refresh_token(body.refresh_token)
    return await _build_token_response(user)


@router.post("/logout")
async def logout(body: RefreshTokenRequest, current_user: dict = Depends(get_current_user)):
    await revoke_refresh_token(body.refresh_token)
    return {"success": True, "message": "Logged out"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if user:
        token = await create_password_reset_token(body.email)
        send_password_reset_email(body.email, token)
    return {"success": True, "message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    email = await verify_password_reset_token(body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    db = get_db()
    await db.users.update_one(
        {"email": email},
        {"$set": {"password": pwd_context.hash(body.new_password[:72])}},
    )
    await consume_password_reset_token(body.token)
    await revoke_all_refresh_tokens(email)
    return {"success": True, "message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"email": current_user["email"]})
    if not user or not pwd_context.verify(body.current_password[:72], user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": pwd_context.hash(body.new_password[:72])}},
    )
    await revoke_all_refresh_tokens(current_user["email"])
    return {"success": True, "message": "Password changed successfully"}


@router.post("/verify-email")
async def verify_email(body: RefreshTokenRequest):
    email = await verify_email_token(body.refresh_token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    db = get_db()
    await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
    await consume_email_verification_token(body.refresh_token)
    return {"success": True, "message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(current_user: dict = Depends(get_current_user)):
    if current_user.get("email_verified"):
        return {"success": True, "message": "Email already verified"}
    token = await create_email_verification_token(current_user["email"])
    send_verification_email(current_user["email"], token)
    return {"success": True, "message": "Verification email sent"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}
