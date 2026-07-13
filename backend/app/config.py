"""
Guardian-Link Configuration
Central configuration for the application.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_ROOT.parent
load_dotenv(_PROJECT_ROOT / ".env")
load_dotenv(_BACKEND_ROOT / ".env")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            "Copy .env.example to .env and set your values before starting the server."
        )
    return value.strip()


def _env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in ("1", "true", "yes", "on")


# ──────────────────────────────────────────────
# Application
# ──────────────────────────────────────────────
APP_NAME = "Guardian-Link API"
APP_VERSION = "3.0.0"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip()
DEBUG = _env_bool("DEBUG", ENVIRONMENT == "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()

# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────
MONGO_URI = _require_env("MONGO_URI")
DATABASE_NAME = os.getenv("DB_NAME", "guardian_link").strip()

# ──────────────────────────────────────────────
# Security / JWT
# ──────────────────────────────────────────────
SECRET_KEY = _require_env("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))
EMAIL_VERIFY_EXPIRE_HOURS = int(os.getenv("EMAIL_VERIFY_EXPIRE_HOURS", "24"))

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()]

# ──────────────────────────────────────────────
# File Uploads
# ──────────────────────────────────────────────
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
LOST_UPLOAD_PATH = os.path.join(UPLOAD_BASE, "lost")
FOUND_UPLOAD_PATH = os.path.join(UPLOAD_BASE, "found")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

os.makedirs(LOST_UPLOAD_PATH, exist_ok=True)
os.makedirs(FOUND_UPLOAD_PATH, exist_ok=True)

# ──────────────────────────────────────────────
# Cloudinary (optional)
# ──────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()
CLOUDINARY_ENABLED = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

# ──────────────────────────────────────────────
# Email (optional — logs to console if not configured)
# ──────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "noreply@guardianlink.com").strip()
EMAIL_ENABLED = bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)

# ──────────────────────────────────────────────
# AI Model
# ──────────────────────────────────────────────
FACE_MODEL_NAME = os.getenv("FACE_MODEL_NAME", "ArcFace").strip() or "ArcFace"
DETECTOR_BACKEND = os.getenv("DETECTOR_BACKEND", "retinaface").strip() or "retinaface"
MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "50.0"))
TOP_MATCH_LIMIT = int(os.getenv("TOP_MATCH_LIMIT", "5"))
AGE_TOLERANCE = int(os.getenv("AGE_TOLERANCE", "2"))
LOCATION_RADIUS = float(os.getenv("LOCATION_RADIUS", "25.0"))
HIGH_MATCH_THRESHOLD = float(os.getenv("HIGH_MATCH_THRESHOLD", "90.0"))
MEDIUM_MATCH_THRESHOLD = float(os.getenv("MEDIUM_MATCH_THRESHOLD", "75.0"))
LOW_MATCH_THRESHOLD = float(os.getenv("LOW_MATCH_THRESHOLD", "60.0"))

# ──────────────────────────────────────────────
# Default Admin Account
# ──────────────────────────────────────────────
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@guardianlink.com").strip()
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "1234")
DEFAULT_ADMIN_NAME = os.getenv("DEFAULT_ADMIN_NAME", "System Admin").strip()
