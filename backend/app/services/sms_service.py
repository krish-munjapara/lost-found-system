"""
Guardian-Link — SMS Service
Abstract SMS provider interface for sending OTP messages.
"""

from abc import ABC, abstractmethod
from typing import Optional
from app.config import SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID


class SMSProvider(ABC):
    """Abstract base class for SMS providers."""
    
    @abstractmethod
    async def send_otp(self, mobile: str, otp: str) -> bool:
        """Send OTP to mobile number."""
        pass


class TwilioSMSProvider(SMSProvider):
    """Twilio SMS provider implementation."""
    
    def __init__(self):
        self.account_sid = SMS_API_KEY
        self.auth_token = SMS_SENDER_ID  # Using SENDER_ID as auth_token placeholder
        self.from_number = SMS_SENDER_ID
    
    async def send_otp(self, mobile: str, otp: str) -> bool:
        """Send OTP via Twilio."""
        try:
            # Import Twilio only when needed to avoid dependency issues
            from twilio.rest import Client
            from twilio.base.exceptions import TwilioRestException
            
            client = Client(self.account_sid, self.auth_token)
            
            message = client.messages.create(
                body=f"Your Guardian-Link verification code is: {otp}. Valid for 5 minutes.",
                from_=self.from_number,
                to=mobile
            )
            
            return message.status in ["queued", "sent"]
        except ImportError:
            # Twilio not installed - log warning
            print("WARNING: Twilio library not installed. SMS not sent.")
            return False
        except TwilioRestException as e:
            print(f"Twilio error: {e}")
            return False
        except Exception as e:
            print(f"SMS sending error: {e}")
            return False


class MockSMSProvider(SMSProvider):
    """Mock SMS provider for development/testing (logs OTP to console)."""
    
    async def send_otp(self, mobile: str, otp: str) -> bool:
        """Log OTP to console (development only)."""
        print(f"[MOCK SMS] OTP for {mobile}: {otp}")
        return True


class SMSService:
    """SMS service with provider abstraction."""
    
    def __init__(self):
        self.provider = self._get_provider()
    
    def _get_provider(self) -> SMSProvider:
        """Get SMS provider based on configuration."""
        provider_name = SMS_PROVIDER.lower() if SMS_PROVIDER else "mock"
        
        if provider_name == "twilio":
            return TwilioSMSProvider()
        else:
            # Default to mock for development
            return MockSMSProvider()
    
    async def send_otp(self, mobile: str, otp: str) -> bool:
        """Send OTP via configured provider."""
        return await self.provider.send_otp(mobile, otp)


# Singleton instance
sms_service = SMSService()
