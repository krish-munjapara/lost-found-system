"""
Guardian-Link Child Model
Pydantic schemas for missing and found children data.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ──────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────
class ChildReport(BaseModel):
    """Schema for reporting a missing or found child."""
    child_name: str = Field(..., min_length=1, max_length=100)
    age: str = Field(..., min_length=1)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    location: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)


# ──────────────────────────────────────────────
# Response Schemas
# ──────────────────────────────────────────────
class ChildResponse(BaseModel):
    """Schema for child data in API responses."""
    id: str
    name: str
    age: str
    gender: str
    location: str
    description: str
    image: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None


class MatchResponse(BaseModel):
    """Schema for match results."""
    id: str
    score: float
    confidence_label: str
    confidence_class: str
    timestamp: Optional[str] = None
    missing: Optional[dict] = None
    found: Optional[dict] = None
