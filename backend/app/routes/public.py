"""
Guardian-Link Public Routes  (NO AUTH REQUIRED)
─────────────────────────────────────────────────
Public-facing endpoints accessible to all visitors.
Used for the public feed page showing missing children
and for sharing individual reports.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from bson import ObjectId

from app.database import get_db
from app.utils import serialize_doc

router = APIRouter(prefix="/api/public", tags=["Public Feed"])


# ──────────────────────────────────────────────
# GET /api/public/feed — Public Missing Children Feed
# No authentication required. Shows all missing children.
# ──────────────────────────────────────────────
@router.get("/feed")
async def get_public_feed(
    search: Optional[str] = Query(None, description="Search by name or location"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Public feed of all missing children reports.
    Accessible without login. Returns paginated results.
    """
    db = get_db()

    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]

    total = await db.children.count_documents(query)
    skip = (page - 1) * limit

    cursor = db.children.find(
        query,
        # Exclude sensitive fields like encoding, reporter_email
        {"encoding": 0, "reporter_email": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)

    children = [serialize_doc(doc) async for doc in cursor]

    return {
        "children": children,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


# ──────────────────────────────────────────────
# GET /api/public/child/{child_id} — Single child detail
# No authentication required.
# ──────────────────────────────────────────────
@router.get("/child/{child_id}")
async def get_public_child(child_id: str):
    """
    Get a single missing child report for sharing/viewing.
    No authentication required.
    """
    db = get_db()

    try:
        oid = ObjectId(child_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid child ID format"
        )

    doc = await db.children.find_one(
        {"_id": oid},
        {"encoding": 0, "reporter_email": 0}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child report not found"
        )

    return serialize_doc(doc)


# ──────────────────────────────────────────────
# GET /api/public/stats — Public statistics
# No authentication required.
# ──────────────────────────────────────────────
@router.get("/stats")
async def get_public_stats():
    """
    Public statistics for the landing/feed page.
    Shows aggregate counts without any sensitive data.
    """
    db = get_db()

    missing_count = await db.children.count_documents({})
    found_count = await db.children_found.count_documents({})
    match_count = await db.children.count_documents({"status": "Ai Matches"})
    resolved_count = await db.children.count_documents({"status": "Resolved"})

    return {
        "missing_count": missing_count,
        "found_count": found_count,
        "match_count": match_count,
        "resolved_count": resolved_count,
    }


# ──────────────────────────────────────────────
# GET /api/public/recent-alerts — Latest 5 missing reports
# Used for the notification ticker / alerts banner
# ──────────────────────────────────────────────
@router.get("/recent-alerts")
async def get_recent_alerts():
    """
    Get the 5 most recent missing child reports for alert banners.
    No authentication required.
    """
    db = get_db()

    cursor = db.children.find(
        {},
        {"encoding": 0, "reporter_email": 0}
    ).sort("created_at", -1).limit(5)

    alerts = [serialize_doc(doc) async for doc in cursor]
    return alerts
