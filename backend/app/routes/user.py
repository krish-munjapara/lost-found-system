"""
Guardian-Link User Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.user_model import UserUpdate, ChangePasswordRequest, NotificationPreferences
from app.utils import serialize_doc, get_timestamp
from app.utils.passwords import hash_password, verify_password
from app.utils.tokens import revoke_all_refresh_tokens
from app.dependencies import get_current_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/user", tags=["User"])

PRIVATE_CHILD_PROJECTION = {"encoding": 0}


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}


@router.put("/profile")
async def update_profile(updates: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"email": current_user["email"]}, {"$set": update_data})
    updated = await db.users.find_one({"email": current_user["email"]})
    safe = serialize_doc(updated)
    safe.pop("password", None)
    return {"success": True, "message": "Profile updated", "user": safe}


@router.put("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"email": current_user["email"]})
    if not user or not verify_password(body.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hash_password(body.new_password)}},
    )
    await revoke_all_refresh_tokens(current_user["email"])
    await log_action(current_user["email"], "password_changed", "user", current_user.get("id"))
    return {"success": True, "message": "Password changed successfully"}


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    prefs = current_user.get("preferences") or {
        "push_notifications": True,
        "email_notifications": True,
        "match_alerts": True,
    }
    return {"success": True, "preferences": prefs}


@router.put("/preferences")
async def update_preferences(
    prefs: NotificationPreferences,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    existing = current_user.get("preferences") or {}
    update = {**existing, **{k: v for k, v in prefs.model_dump().items() if v is not None}}
    await db.users.update_one({"email": current_user["email"]}, {"$set": {"preferences": update}})
    return {"success": True, "preferences": update}


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"]
    if current_user.get("role") == "Admin":
        raise HTTPException(status_code=400, detail="Admin accounts cannot self-delete")
    await db.children.delete_many({"reporter_email": email})
    await db.children_found.delete_many({"reporter_email": email})
    await db.user_notifications.delete_many({"recipient_email": email})
    await db.users.delete_one({"email": email})
    await revoke_all_refresh_tokens(email)
    await log_action(email, "account_deleted", "user", current_user.get("id"))
    return {"success": True, "message": "Account deleted successfully"}


@router.get("/my-reports")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"]
    missing = [serialize_doc(d) async for d in db.children.find(
        {"reporter_email": email}, PRIVATE_CHILD_PROJECTION
    ).sort("created_at", -1)]
    found = [serialize_doc(d) async for d in db.children_found.find(
        {"reporter_email": email}, PRIVATE_CHILD_PROJECTION
    ).sort("created_at", -1)]
    return {
        "success": True,
        "missing_reports": missing,
        "found_reports": found,
        "total_missing": len(missing),
        "total_found": len(found),
    }


@router.get("/notifications")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"]
    cursor = db.user_notifications.find({"recipient_email": email}).sort("created_at", -1).limit(50)
    notifications = [serialize_doc(doc) async for doc in cursor]
    unread = await db.user_notifications.count_documents({"recipient_email": email, "read": False})
    return {"success": True, "notifications": notifications, "unread_count": unread}


@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    db = get_db()
    try:
        oid = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    result = await db.user_notifications.update_one(
        {"_id": oid, "recipient_email": current_user["email"]},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.user_notifications.update_many(
        {"recipient_email": current_user["email"], "read": False},
        {"$set": {"read": True}},
    )
    return {"success": True, "modified": result.modified_count}


@router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    db = get_db()
    try:
        oid = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    result = await db.user_notifications.delete_one(
        {"_id": oid, "recipient_email": current_user["email"]},
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}
