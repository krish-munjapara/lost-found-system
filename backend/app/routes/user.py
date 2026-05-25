"""
Guardian-Link — User Routes (Protected)
────────────────────────────────────────
User-specific endpoints that require authentication.
Normal users can ONLY access their own data.

NOTIFICATION TYPES:
  - match_lost_reporter   → "Possible match found for your missing child"
  - match_found_reporter  → "This child may match a reported missing case"
  - match_confirmed       → Admin confirmed a match
  - match_rejected        → Admin rejected a match
  - match_admin_review    → Admin: new match requires verification
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.utils import serialize_doc, get_timestamp
from app.models import UserUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/user", tags=["User"])


# ──────────────────────────────────────────────
# GET /api/user/profile
# Returns the currently logged-in user's profile
# ──────────────────────────────────────────────
@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the authenticated user's own profile.
    Users can ONLY see their own data — never another user's.
    """
    return {
        "success": True,
        "user": current_user,
    }


# ──────────────────────────────────────────────
# PUT /api/user/profile
# Update the currently logged-in user's profile
# ──────────────────────────────────────────────
@router.put("/profile")
async def update_profile(
    updates: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the authenticated user's own profile.
    Only the owner can update their data.
    """
    db = get_db()

    # Build update dict from non-None fields
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": update_data}
    )

    # Fetch updated user
    updated_user = await db.users.find_one({"email": current_user["email"]})
    safe_user = serialize_doc(updated_user)
    safe_user.pop("password", None)

    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": safe_user,
    }


# ──────────────────────────────────────────────
# GET /api/user/my-reports
# Returns ONLY reports submitted by the logged-in user
# ──────────────────────────────────────────────
@router.get("/my-reports")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """
    Get all reports (missing + found) submitted by the current user.
    Normal users can NEVER see other users' reports through this endpoint.
    """
    db = get_db()
    user_email = current_user["email"]

    # Fetch this user's missing reports
    missing_cursor = db.children.find(
        {"reporter_email": user_email}
    ).sort("created_at", -1)
    my_missing = [serialize_doc(doc) async for doc in missing_cursor]

    # Fetch this user's found reports
    found_cursor = db.children_found.find(
        {"reporter_email": user_email}
    ).sort("created_at", -1)
    my_found = [serialize_doc(doc) async for doc in found_cursor]

    return {
        "success": True,
        "missing_reports": my_missing,
        "found_reports": my_found,
        "total_missing": len(my_missing),
        "total_found": len(my_found),
    }


# ──────────────────────────────────────────────
# GET /api/user/notifications
# Returns match-related notifications for the logged-in user
# ──────────────────────────────────────────────
@router.get("/notifications")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """
    Get the authenticated user's own notifications.
    These are generated when an AI match is found involving
    one of the user's reports, or when admin confirms/rejects a match.
    """
    db = get_db()
    user_email = current_user["email"]

    cursor = db.user_notifications.find(
        {"recipient_email": user_email}
    ).sort("created_at", -1).limit(50)

    notifications = [serialize_doc(doc) async for doc in cursor]

    unread_count = await db.user_notifications.count_documents({
        "recipient_email": user_email,
        "read": False
    })

    # Group notifications by type for quick stats
    type_counts = {}
    for n in notifications:
        ntype = n.get("type", "unknown")
        type_counts[ntype] = type_counts.get(ntype, 0) + 1

    return {
        "success": True,
        "notifications": notifications,
        "unread_count": unread_count,
        "total_count": len(notifications),
        "type_counts": type_counts,
    }


# ──────────────────────────────────────────────
# PUT /api/user/notifications/{notif_id}/read
# Mark a single notification as read
# ──────────────────────────────────────────────
@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    from bson import ObjectId
    db = get_db()

    try:
        oid = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db.user_notifications.update_one(
        {"_id": oid, "recipient_email": current_user["email"]},
        {"$set": {"read": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True, "message": "Notification marked as read"}


# ──────────────────────────────────────────────
# PUT /api/user/notifications/read-all
# Mark ALL notifications as read for the logged-in user
# ──────────────────────────────────────────────
@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
):
    """Mark all notifications for the current user as read."""
    db = get_db()

    result = await db.user_notifications.update_many(
        {"recipient_email": current_user["email"], "read": False},
        {"$set": {"read": True}}
    )

    return {
        "success": True,
        "message": f"{result.modified_count} notifications marked as read"
    }


# ──────────────────────────────────────────────
# DELETE /api/user/notifications/{notif_id}
# Delete a single notification
# ──────────────────────────────────────────────
@router.delete("/notifications/{notif_id}")
async def delete_notification(
    notif_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a specific notification."""
    from bson import ObjectId
    db = get_db()

    try:
        oid = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db.user_notifications.delete_one(
        {"_id": oid, "recipient_email": current_user["email"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True, "message": "Notification deleted"}
