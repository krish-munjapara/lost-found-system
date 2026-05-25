"""
Guardian-Link Admin Routes  (ADMIN ONLY)
─────────────────────────────────────────
Every endpoint in this file is protected by Depends(require_admin).
If a normal User tries to access these → 403 Forbidden.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.database import get_db
from app.utils import serialize_doc, validate_object_id
from app.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ──────────────────────────────────────────────
# GET /api/admin/dashboard  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_admin)):
    """
    Get admin dashboard with ALL system data.
    Only accessible by users with role='Admin'.
    Normal users get 403 Forbidden.
    """
    db = get_db()

    # Aggregate counts
    user_count = await db.users.count_documents({})
    missing_count = await db.children.count_documents({})
    found_count = await db.children_found.count_documents({})
    match_count = await db.children.count_documents({"status": "Ai Matches"})

    # Fetch ALL data (admin sees everything)
    users_cursor = db.users.find().sort("_id", -1)
    users = []
    async for doc in users_cursor:
        safe = serialize_doc(doc)
        safe.pop("password", None)     # Never expose passwords
        safe.pop("encoding", None)
        users.append(safe)

    missing_children = [
        serialize_doc(doc) async for doc in db.children.find().sort("_id", -1)
    ]
    found_children = [
        serialize_doc(doc) async for doc in db.children_found.find().sort("_id", -1)
    ]

    return {
        "user_count": user_count,
        "missing_count": missing_count,
        "found_count": found_count,
        "match_count": match_count,
        "users": users,
        "missing_children": missing_children,
        "found_children": found_children,
    }


# ──────────────────────────────────────────────
# GET /api/admin/all-users  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.get("/all-users")
async def get_all_users(current_user: dict = Depends(require_admin)):
    """
    List ALL registered users in the system.
    Only accessible by Admins.
    """
    db = get_db()
    users = []
    async for doc in db.users.find().sort("_id", -1):
        safe = serialize_doc(doc)
        safe.pop("password", None)
        users.append(safe)
    return {"success": True, "users": users, "count": len(users)}


# ──────────────────────────────────────────────
# DELETE /api/admin/users/{user_id}  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Delete a user account. Admin only."""
    obj_id = validate_object_id(user_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    db = get_db()
    result = await db.users.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "message": "User deleted"}


# ──────────────────────────────────────────────
# DELETE /api/admin/missing/{child_id}  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.delete("/missing/{child_id}")
async def delete_missing_child(child_id: str, current_user: dict = Depends(require_admin)):
    """Delete a missing child report and its matches. Admin only."""
    obj_id = validate_object_id(child_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid child ID")

    db = get_db()
    await db.children.delete_one({"_id": obj_id})
    await db.matches.delete_many({"missing_id": obj_id})

    return {"success": True, "message": "Missing child report deleted"}


# ──────────────────────────────────────────────
# DELETE /api/admin/found/{child_id}  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.delete("/found/{child_id}")
async def delete_found_child(child_id: str, current_user: dict = Depends(require_admin)):
    """Delete a found child report and its matches. Admin only."""
    obj_id = validate_object_id(child_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid child ID")

    db = get_db()
    await db.children_found.delete_one({"_id": obj_id})
    await db.matches.delete_many({"found_id": obj_id})

    return {"success": True, "message": "Found child report deleted"}
