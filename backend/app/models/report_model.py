"""
Guardian-Link Report Model
Pydantic schemas for reports and notifications.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReportCreate(BaseModel):
    """Schema for creating a report."""
    report_type: str = Field(..., pattern="^(missing|found)$")
    child_name: str
    age: str
    gender: str
    location: str
    description: str


class ReportResponse(BaseModel):
    """Schema for report in API responses."""
    id: str
    report_type: str
    child_name: str
    age: str
    gender: str
    location: str
    description: str
    image: Optional[str] = None
    status: str
    reporter_email: Optional[str] = None
    created_at: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema for notifications."""
    id: str
    message: str
    created_at: Optional[str] = None
    read: bool = False
