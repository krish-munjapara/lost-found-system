"""
Guardian-Link User Model
Pydantic schemas for user data validation.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """Registration body for POST /api/auth/register (alias: RegisterRequest)."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    mobile: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    address: str = Field(..., min_length=3)


class GoogleAuthRequest(BaseModel):
    """Google OAuth authentication request."""
    token: str  # Google ID token


# Backward-compatible alias used in docs / older references
RegisterRequest = UserRegister


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile: Optional[str] = Field(None, min_length=10, max_length=15)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    address: Optional[str] = Field(None, min_length=3)
    profile_complete: Optional[bool] = None
    mobile_verified: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SendOTPRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)
    purpose: str = Field(default="registration", pattern="^(registration|profile_completion)$")


class VerifyOTPRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6)
    pending_token: Optional[str] = None


class NotificationPreferences(BaseModel):
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    match_alerts: Optional[bool] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_name: str
    email: str
    email_verified: bool = False
    profile_complete: bool = True
    mobile_verified: bool = False


class PendingSignupResponse(BaseModel):
    """Response for new Google user pending signup."""
    pending_token: str
    google_email: str
    google_name: str
    google_picture: Optional[str] = None
    requires_profile_completion: bool = True


class CompleteGoogleProfileRequest(BaseModel):
    """Request to complete Google user profile and create real account."""
    pending_token: str
    mobile: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    address: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    mobile: str
    gender: str
    address: str
    role: str
    email_verified: bool = False
    created_at: Optional[str] = None
