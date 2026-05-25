"""
Guardian-Link User Model
Pydantic schemas for user data validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ──────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────
class UserRegister(BaseModel):
    """Schema for user registration."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=4)
    mobile: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    address: str = Field(..., min_length=3)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None


# ──────────────────────────────────────────────
# Response Schemas
# ──────────────────────────────────────────────
class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: str
    full_name: str
    email: str
    mobile: str
    gender: str
    address: str
    role: str
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    role: str
    user_name: str
