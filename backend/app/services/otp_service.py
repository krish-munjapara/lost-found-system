"""
Guardian-Link — OTP Service
Handles secure OTP generation, storage, and verification for mobile verification.
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.database import get_db
from app.utils import get_timestamp


class OTPService:
    """Service for managing mobile OTP verification."""
    
    # OTP Configuration
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 5
    RESEND_COOLDOWN_SECONDS = 60
    
    @staticmethod
    def generate_otp() -> str:
        """Generate a cryptographically secure 6-digit OTP."""
        return ''.join([str(secrets.randbelow(10)) for _ in range(OTPService.OTP_LENGTH)])
    
    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash OTP for secure storage."""
        return hashlib.sha256(otp.encode()).hexdigest()
    
    @staticmethod
    async def store_otp(mobile: str, otp: str, purpose: str = "registration") -> Dict:
        """Store OTP in database with expiration metadata."""
        db = get_db()
        otp_hash = OTPService.hash_otp(otp)
        expires_at = datetime.utcnow() + timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES)
        
        # Invalidate any existing OTP for this mobile
        await db.otps.delete_many({"mobile": mobile})
        
        otp_doc = {
            "mobile": mobile,
            "otp_hash": otp_hash,
            "purpose": purpose,
            "attempts": 0,
            "expires_at": expires_at,
            "created_at": get_timestamp(),
        }
        
        await db.otps.insert_one(otp_doc)
        return {"expires_at": expires_at}
    
    @staticmethod
    async def verify_otp(mobile: str, otp: str) -> bool:
        """Verify OTP and invalidate if successful."""
        db = get_db()
        otp_hash = OTPService.hash_otp(otp)
        
        otp_record = await db.otps.find_one({
            "mobile": mobile,
            "otp_hash": otp_hash,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not otp_record:
            return False
        
        # Check attempt limit
        if otp_record.get("attempts", 0) >= OTPService.MAX_ATTEMPTS:
            await db.otps.delete_one({"_id": otp_record["_id"]})
            return False
        
        # Increment attempts
        await db.otps.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        
        # If this is the first successful verification, invalidate OTP
        if otp_record.get("attempts", 0) == 0:
            await db.otps.delete_one({"_id": otp_record["_id"]})
            return True
        
        return False
    
    @staticmethod
    async def can_resend_otp(mobile: str) -> tuple[bool, Optional[int]]:
        """Check if OTP can be resent (cooldown check)."""
        db = get_db()
        latest_otp = await db.otps.find_one(
            {"mobile": mobile},
            sort=[("created_at", -1)]
        )
        
        if not latest_otp:
            return True, None
        
        created_at = latest_otp.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        cooldown_end = created_at + timedelta(seconds=OTPService.RESEND_COOLDOWN_SECONDS)
        now = datetime.utcnow()
        
        if now < cooldown_end:
            remaining_seconds = int((cooldown_end - now).total_seconds())
            return False, remaining_seconds
        
        return True, None
    
    @staticmethod
    async def invalidate_otp(mobile: str) -> None:
        """Invalidate all OTPs for a mobile number."""
        db = get_db()
        await db.otps.delete_many({"mobile": mobile})
    
    @staticmethod
    async def cleanup_expired_otps() -> int:
        """Clean up expired OTPs from database (maintenance task)."""
        db = get_db()
        result = await db.otps.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })
        return result.deleted_count


# Singleton instance
otp_service = OTPService()
