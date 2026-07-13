"""
Guardian-Link Admin Routes
"""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.database import get_db
from app.utils import serialize_doc, validate_object_id, get_timestamp
from app.dependencies import require_admin
from app.services.audit_service import log_action
from app.config import LOST_UPLOAD_PATH, FOUND_UPLOAD_PATH

router = APIRouter(prefix="/api/admin", tags=["Admin"])

PRIVATE_PROJECTION = {"encoding": 0}


def _delete_image_file(filename: str, folder: str) -> None:
    if not filename:
        return
    base = LOST_UPLOAD_PATH if folder == "lost" else FOUND_UPLOAD_PATH
    path = Path(base) / filename
    path.unlink(missing_ok=True)


@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_admin)):
    db = get_db()
    return {
        "user_count": await db.users.count_documents({}),
        "missing_count": await db.children.count_documents({}),
        "found_count": await db.children_found.count_documents({}),
        "match_count": await db.matches.count_documents({}),
        "pending_matches": await db.matches.count_documents({"status": "Pending"}),
        "confirmed_matches": await db.matches.count_documents({"status": "Confirmed"}),
        "rejected_matches": await db.matches.count_documents({"status": "Rejected"}),
        "resolved_count": await db.children.count_documents({"status": "Resolved"}),
        "users": [
            {k: v for k, v in serialize_doc(u).items() if k != "password"}
            async for u in db.users.find({}, {"password": 0, "encoding": 0}).sort("created_at", -1)
        ],
        "missing_children": [
            serialize_doc(d) async for d in db.children.find({}, PRIVATE_PROJECTION).sort("created_at", -1).limit(20)
        ],
        "found_children": [
            serialize_doc(d) async for d in db.children_found.find({}, PRIVATE_PROJECTION).sort("created_at", -1).limit(20)
        ],
    }


@router.get("/all-users")
async def get_all_users(current_user: dict = Depends(require_admin)):
    db = get_db()
    users = []
    async for doc in db.users.find({}, {"password": 0}).sort("created_at", -1):
        users.append(serialize_doc(doc))
    return {"success": True, "users": users, "count": len(users)}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    current_user: dict = Depends(require_admin),
):
    db = get_db()
    logs = [
        serialize_doc(doc)
        async for doc in db.audit_logs.find().sort("created_at", -1).limit(min(limit, 200))
    ]
    return {"success": True, "logs": logs}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    obj_id = validate_object_id(user_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    db = get_db()
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == "Admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    email = user["email"]
    await db.children.delete_many({"reporter_email": email})
    await db.children_found.delete_many({"reporter_email": email})
    await db.user_notifications.delete_many({"recipient_email": email})
    await db.users.delete_one({"_id": obj_id})
    await log_action(current_user["email"], "delete_user", "user", user_id, {"deleted_email": email})
    return {"success": True, "message": "User deleted"}


@router.delete("/missing/{child_id}")
async def delete_missing_child(child_id: str, current_user: dict = Depends(require_admin)):
    obj_id = validate_object_id(child_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid child ID")
    db = get_db()
    doc = await db.children.find_one({"_id": obj_id})
    if doc:
        _delete_image_file(doc.get("image"), "lost")
    await db.children.delete_one({"_id": obj_id})
    await db.matches.delete_many({"missing_id": obj_id})
    await log_action(current_user["email"], "delete_missing_report", "child", child_id)
    return {"success": True, "message": "Missing child report deleted"}


@router.put("/missing/{child_id}/resolve")
async def resolve_missing_child(child_id: str, current_user: dict = Depends(require_admin)):
    obj_id = validate_object_id(child_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid child ID")
    db = get_db()
    await db.children.update_one({"_id": obj_id}, {"$set": {"status": "Resolved", "resolved_at": get_timestamp()}})
    await log_action(current_user["email"], "resolve_missing_report", "child", child_id)
    return {"success": True, "message": "Case marked as resolved"}


@router.delete("/found/{child_id}")
async def delete_found_child(child_id: str, current_user: dict = Depends(require_admin)):
    obj_id = validate_object_id(child_id)
    if not obj_id:
        raise HTTPException(status_code=400, detail="Invalid child ID")
    db = get_db()
    doc = await db.children_found.find_one({"_id": obj_id})
    if doc:
        _delete_image_file(doc.get("image"), "found")
    await db.children_found.delete_one({"_id": obj_id})
    await db.matches.delete_many({"found_id": obj_id})
    await log_action(current_user["email"], "delete_found_report", "child", child_id)
    return {"success": True, "message": "Found child report deleted"}
