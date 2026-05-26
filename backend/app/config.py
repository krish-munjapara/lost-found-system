"""
Guardian-Link Configuration
Central configuration for the application.
"""

import os

# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://munjaparakrish25:<Krish123>@guardian-link.ffn1qkp.mongodb.net/?appName=guardian-link")
DATABASE_NAME = os.getenv("DB_NAME", "guardian_link")

# ──────────────────────────────────────────────
# Security
# ──────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "guardian-link-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ──────────────────────────────────────────────
# File Uploads
# ──────────────────────────────────────────────
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
LOST_UPLOAD_PATH = os.path.join(UPLOAD_BASE, "lost")
FOUND_UPLOAD_PATH = os.path.join(UPLOAD_BASE, "found")

# Ensure upload directories exist
os.makedirs(LOST_UPLOAD_PATH, exist_ok=True)
os.makedirs(FOUND_UPLOAD_PATH, exist_ok=True)

# ──────────────────────────────────────────────
# AI Model
# ──────────────────────────────────────────────
FACE_MODEL_NAME = "Facenet"
MATCH_THRESHOLD = 50.0  # Minimum similarity % to register as a match

# ──────────────────────────────────────────────
# Default Admin Account
# ──────────────────────────────────────────────
DEFAULT_ADMIN_EMAIL = "admin@guardianlink.com"
DEFAULT_ADMIN_PASSWORD = "1234"
DEFAULT_ADMIN_NAME = "System Admin"
