"""
Guardian-Link Report Routes  (PROTECTED)
─────────────────────────────────────────
Dashboard stats and notifications require authentication.
Admin gets system-wide stats; normal User gets their own stats.
"""

from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils import serialize_doc
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


# ──────────────────────────────────────────────
# GET /api/reports/stats  ← PROTECTED
# Admin → system-wide stats
# User  → only their own report counts
# ──────────────────────────────────────────────
@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Get dashboard statistics.
    Admin sees total counts across all users.
    Normal User sees only counts for their own reports.
    """
    db = get_db()
    is_admin = current_user.get("role") == "Admin"
    user_email = current_user["email"]

    if is_admin:
        # Admin sees everything
        missing_query = {}
        found_query = {}
    else:
        # User sees only their own data
        missing_query = {"reporter_email": user_email}
        found_query = {"reporter_email": user_email}

    missing_count = await db.children.count_documents(missing_query)
    found_count = await db.children_found.count_documents(found_query)
    pending_count = await db.children.count_documents({**missing_query, "status": "Pending"})
    match_count = await db.children.count_documents({**missing_query, "status": "Ai Matches"})

    # Recent entries
    recent_missing = [
        serialize_doc(doc)
        async for doc in db.children.find(missing_query).sort("created_at", -1).limit(5)
    ]
    recent_found = [
        serialize_doc(doc)
        async for doc in db.children_found.find(found_query).sort("created_at", -1).limit(5)
    ]

    return {
        "missing_count": missing_count,
        "found_count": found_count,
        "pending_count": pending_count,
        "match_count": match_count,
        "recent_missing": recent_missing,
        "recent_found": recent_found,
        "role": current_user.get("role"),
    }


# ──────────────────────────────────────────────
# GET /api/reports/notifications  ← PROTECTED
# ──────────────────────────────────────────────
@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get recent notifications. Requires authentication."""
    db = get_db()
    cursor = db.notifications.find().sort("created_at", -1).limit(10)
    notifications = [serialize_doc(doc) async for doc in cursor]
    return notifications
