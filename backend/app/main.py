"""
Guardian-Link — Application Entry Point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext

from app.database import connect_db, close_db, get_db
from app.database.indexes import ensure_indexes
from app.routes import (
    auth_router, admin_router, children_router,
    report_router, match_router, user_router, public_router,
)
from app.config import (
    DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD,
    DEFAULT_ADMIN_NAME, CORS_ORIGINS, APP_NAME, APP_VERSION,
)
from app.utils import get_timestamp
from app.utils.errors import register_exception_handlers

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await ensure_indexes()
    await create_default_admin()
    print(f"{APP_NAME} v{APP_VERSION} is ready!")
    yield
    await close_db()


async def create_default_admin():
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
            "email_verified": True,
            "preferences": {
                "push_notifications": True,
                "email_notifications": True,
                "match_alerts": True,
            },
            "created_at": get_timestamp(),
        })
        print(f"Default admin created: {DEFAULT_ADMIN_EMAIL}")


app = FastAPI(
    title=APP_NAME,
    description="Lost & Found Children Identification System — AI-Powered",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(public_router)
app.include_router(user_router)
app.include_router(children_router)
app.include_router(report_router)
app.include_router(match_router)
app.include_router(admin_router)


@app.get("/uploads/{folder}/{filename}", tags=["Uploads"])
async def redirect_upload_to_cloudinary(folder: str, filename: str):
    db = get_db()
    base_name = filename.rsplit(".", 1)[0]
    target_public_id = f"guardian-link/{folder}/{base_name}"
    
    # 1. Search by exact public_id
    doc = await db.children.find_one({"public_id": target_public_id})
    if not doc:
        doc = await db.children_found.find_one({"public_id": target_public_id})
        
    # 2. Search by public_id ending in base_name (regex fallback)
    if not doc:
        doc = await db.children.find_one({"public_id": {"$regex": f"{base_name}$"}})
    if not doc:
        doc = await db.children_found.find_one({"public_id": {"$regex": f"{base_name}$"}})
        
    if doc and doc.get("image_url"):
        return RedirectResponse(url=doc["image_url"], status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        
    raise HTTPException(status_code=404, detail="Image not found")


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "online", "service": APP_NAME, "version": APP_VERSION}


@app.get("/api/test", tags=["Health"])
async def test():
    return {"message": f"{APP_NAME} is running"}
