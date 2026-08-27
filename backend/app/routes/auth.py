"""
Guardian-Link Auth Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth_deps import get_current_user
from app.database import get_db
from app.models.user_model import (
    UserRegister,
    UserLogin,
    UserUpdate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    GoogleAuthRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    TokenResponse,
    PendingSignupResponse,
    CompleteGoogleProfileRequest,
)
from app.utils.passwords import hash_password, verify_password
from app.utils.tokens import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    create_email_verification_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from datetime import timedelta
import secrets
from app.services.email_service import send_verification_email, send_password_reset_email
from app.services.otp_service import otp_service
from app.services.sms_service import sms_service
from app.utils import get_timestamp

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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
        profile_complete=user.get("profile_complete", True),
        mobile_verified=user.get("mobile_verified", False),
    )


@router.post("/register")
async def register(user: UserRegister):
    db = get_db()
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_doc = {
        "full_name": user.full_name,
        "email": user.email,
        "password": hash_password(user.password),
        "mobile": user.mobile,
        "gender": user.gender,
        "address": user.address,
        "role": "User",
        "email_verified": False,
        "mobile_verified": False,
        "profile_complete": False,
        "preferences": _default_preferences(),
        "created_at": get_timestamp(),
    }
    await db.users.insert_one(user_doc)

    # Send email verification
    token = await create_email_verification_token(user.email)
    send_verification_email(user.email, token)

    # Send OTP for mobile verification
    otp = otp_service.generate_otp()
    await otp_service.store_otp(user.mobile, otp, "registration")
    await sms_service.send_otp(user.mobile, otp)

    return {
        "success": True,
        "message": "Registered successfully. Please verify your mobile number.",
        "mobile": user.mobile,
        "requires_otp": True
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password = credentials.password

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check if mobile is verified
    # If not verified, user will need to complete mobile verification
    # The frontend will handle this based on mobile_verified flag in token response
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
        {"$set": {"password": hash_password(body.new_password)}},
    )
    await consume_password_reset_token(body.token)
    await revoke_all_refresh_tokens(email)
    return {"success": True, "message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"email": current_user["email"]})
    if not user or not verify_password(body.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hash_password(body.new_password)}},
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


@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google OAuth ID token."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.config import GOOGLE_CLIENT_ID

    db = get_db()

    # Strip any accidental whitespace
    token = request.token.strip() if request.token else ""

    print("[GOOGLE AUTH] Request received")

    try:
        # Verify Google ID token
        print("[GOOGLE AUTH] Token verification started")
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        print("[GOOGLE AUTH] Token verified")

        # Get user info from verified token
        google_email = idinfo.get("email")
        google_sub = idinfo.get("sub")  # Google's unique user ID
        google_name = idinfo.get("name", "")
        google_picture = idinfo.get("picture", "")

        if not google_email or not google_sub:
            raise HTTPException(status_code=400, detail="Invalid Google token: missing email or sub")

        # Check if user exists by email
        existing_user = await db.users.find_one({"email": google_email})
        print(f"[GOOGLE AUTH] Existing user found: {existing_user is not None}")

        if existing_user:
            # User exists - check if they already have Google auth
            if existing_user.get("auth_provider") == "google" and existing_user.get("google_id") == google_sub:
                # Existing Google user - login
                print("[GOOGLE AUTH] Existing Google user - returning JWT")
                return await _build_token_response(existing_user)
            elif existing_user.get("auth_provider") == "local":
                # Local user with same email - require password login
                print("[GOOGLE AUTH] Local user exists - requiring password login")
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists using password authentication. Please sign in with your password."
                )
            else:
                # Link Google to existing account
                print("[GOOGLE AUTH] Linking Google to existing account")
                await db.users.update_one(
                    {"email": google_email},
                    {"$set": {"auth_provider": "google", "google_id": google_sub, "email_verified": True}}
                )
                updated_user = await db.users.find_one({"email": google_email})
                print("[GOOGLE AUTH] Account linked - returning JWT")
                return await _build_token_response(updated_user)
        else:
            # New user - create pending signup instead of real user
            print("[GOOGLE AUTH] New user - creating pending signup")
            pending_token = secrets.token_urlsafe(32)
            expires_at = get_timestamp() + timedelta(minutes=30)  # 30 minutes from now
            
            pending_signup = {
                "google_id": google_sub,
                "email": google_email,
                "full_name": google_name,
                "picture": google_picture,
                "email_verified": True,
                "pending_token": pending_token,
                "created_at": get_timestamp(),
                "expires_at": expires_at,
            }
            
            await db.pending_google_signups.insert_one(pending_signup)
            
            # Create TTL index if it doesn't exist
            await db.pending_google_signups.create_index(
                "expires_at",
                expireAfterSeconds=0
            )
            
            print("[GOOGLE AUTH] Pending signup created - returning pending response")
            return PendingSignupResponse(
                pending_token=pending_token,
                google_email=google_email,
                google_name=google_name,
                google_picture=google_picture,
                requires_profile_completion=True,
            )

    except ValueError as e:
        print(f"[GOOGLE AUTH] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        print(f"[GOOGLE AUTH] Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")


@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to mobile number for verification."""
    # Check resend cooldown
    can_resend, remaining_seconds = await otp_service.can_resend_otp(request.mobile)
    if not can_resend:
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {remaining_seconds} seconds before requesting another OTP."
        )
    
    # Generate and store OTP
    otp = otp_service.generate_otp()
    await otp_service.store_otp(request.mobile, otp, request.purpose)
    
    # Send OTP via SMS
    sms_sent = await sms_service.send_otp(request.mobile, otp)
    
    if not sms_sent:
        # Even if SMS fails, OTP is stored for testing
        # In production, you might want to handle this differently
        pass
    
    return {"success": True, "message": "OTP sent successfully"}


@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and update user mobile_verified status."""
    # Verify OTP
    is_valid = await otp_service.verify_otp(request.mobile, request.otp)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    db = get_db()
    
    # Check if this is a pending Google signup
    if request.pending_token:
        # Verify pending signup exists and is valid
        pending_signup = await db.pending_google_signups.find_one({
            "pending_token": request.pending_token
        })
        
        if not pending_signup:
            raise HTTPException(status_code=400, detail="Your verification session has expired. Please sign in with Google again.")
        
        # Check if pending signup has expired
        if pending_signup.get("expires_at", 0) < get_timestamp():
            await db.pending_google_signups.delete_one({"pending_token": request.pending_token})
            raise HTTPException(status_code=400, detail="Your verification session has expired. Please sign in with Google again.")
        
        # Update pending signup with mobile and mark as verified
        await db.pending_google_signups.update_one(
            {"pending_token": request.pending_token},
            {"$set": {"mobile": request.mobile, "mobile_verified": True}}
        )
        
        # Invalidate OTP after successful verification
        await otp_service.invalidate_otp(request.mobile)
        
        return {"success": True, "message": "Mobile verified successfully"}
    else:
        # Existing user flow
        user = await db.users.find_one({"mobile": request.mobile})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found with this mobile number")
        
        await db.users.update_one(
            {"mobile": request.mobile},
            {"$set": {"mobile_verified": True, "profile_complete": True}}
        )
        
        # Invalidate OTP after successful verification
        await otp_service.invalidate_otp(request.mobile)
        
        return {"success": True, "message": "Mobile verified successfully"}


@router.post("/complete-google-profile", response_model=TokenResponse)
async def complete_google_profile(request: CompleteGoogleProfileRequest):
    """Complete Google user profile and create real user account."""
    db = get_db()
    
    # Verify pending token and get pending signup
    pending_signup = await db.pending_google_signups.find_one({
        "pending_token": request.pending_token
    })
    
    if not pending_signup:
        raise HTTPException(status_code=400, detail="Invalid or expired pending token")
    
    # Check if pending signup has expired
    if pending_signup.get("expires_at", 0) < get_timestamp():
        await db.pending_google_signups.delete_one({"pending_token": request.pending_token})
        raise HTTPException(status_code=400, detail="Pending signup has expired")
    
    # Check if mobile was verified in pending signup
    if not pending_signup.get("mobile_verified", False):
        raise HTTPException(status_code=400, detail="Mobile number must be verified before completing profile")
    
    # Verify the mobile matches the verified mobile in pending signup
    if pending_signup.get("mobile") != request.mobile:
        raise HTTPException(status_code=400, detail="Mobile number does not match verified number")
    
    # Check if user already exists (race condition check)
    existing_user = await db.users.find_one({"email": pending_signup["email"]})
    if existing_user:
        await db.pending_google_signups.delete_one({"pending_token": request.pending_token})
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create the real user account
    user_doc = {
        "full_name": pending_signup["full_name"],
        "email": pending_signup["email"],
        "google_id": pending_signup["google_id"],
        "auth_provider": "google",
        "picture": pending_signup.get("picture", ""),
        "mobile": request.mobile,
        "gender": request.gender,
        "address": request.address,
        "role": "User",
        "email_verified": True,
        "mobile_verified": True,
        "profile_complete": True,
        "preferences": _default_preferences(),
        "created_at": get_timestamp(),
    }
    
    await db.users.insert_one(user_doc)
    new_user = await db.users.find_one({"email": pending_signup["email"]})
    
    # Delete pending signup
    await db.pending_google_signups.delete_one({"pending_token": request.pending_token})
    
    # Invalidate OTP after successful verification
    await otp_service.invalidate_otp(request.mobile)
    
    # Return normal JWT tokens
    return await _build_token_response(new_user)
