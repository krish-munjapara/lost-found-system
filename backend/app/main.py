"""
Guardian-Link — Lost & Found Children Identification System
FastAPI Application Entry Point

This is the main FastAPI application that:
- Connects to MongoDB on startup
- Registers all API routes (with RBAC protection)
- Serves static uploaded files
- Creates a default admin account on first run
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from passlib.context import CryptContext

from app.database import connect_db, close_db, get_db
from app.routes import (
    auth_router, admin_router, children_router,
    report_router, match_router, user_router, public_router,
)
from app.config import (
    UPLOAD_BASE,
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    DEFAULT_ADMIN_NAME,
)
from app.utils import get_timestamp

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ──────────────────────────────────────────────
# Application Lifecycle
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    await connect_db()
    await create_default_admin()
    print("🚀 Guardian-Link API is ready!")
    yield
    # Shutdown
    await close_db()


async def create_default_admin():
    """Create default admin account if it doesn't exist."""
    db = get_db()
    existing = await db.users.find_one({"email": DEFAULT_ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "full_name": DEFAULT_ADMIN_NAME,
            "email": DEFAULT_ADMIN_EMAIL,
            "password": pwd_context.hash(DEFAULT_ADMIN_PASSWORD),
            "mobile": "0000000000",
            "gender": "Other",
            "address": "System",
            "role": "Admin",
            "created_at": get_timestamp()
        })
        print(f"👤 Default admin created: {DEFAULT_ADMIN_EMAIL}")


# ──────────────────────────────────────────────
# FastAPI Application
# ──────────────────────────────────────────────
app = FastAPI(
    title="Guardian-Link API",
    description="Lost & Found Children Identification System — AI-Powered",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — Allow React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Static Files (serve uploaded images)
# ──────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=UPLOAD_BASE), name="uploads")

# ──────────────────────────────────────────────
# Register Routes
# ──────────────────────────────────────────────
# Public routes (no auth required)
app.include_router(auth_router)
app.include_router(public_router)       # /api/public/*    — public feed & sharing

# Protected routes (require JWT — get_current_user)
app.include_router(user_router)         # /api/user/*     — user's own data
app.include_router(children_router)     # /api/children/*  — role-filtered
app.include_router(report_router)       # /api/reports/*   — role-filtered
app.include_router(match_router)        # /api/matches/*   — role-filtered

# Admin-only routes (require JWT + Admin role — require_admin)
app.include_router(admin_router)        # /api/admin/*     — 403 if not Admin


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "online",
        "service": "Guardian-Link API",
        "version": "2.0.0"
    }


@app.get("/api/test", tags=["Health"])
async def test():
    return {"message": "Guardian-Link API is running (with MongoDB + RBAC!)"}
