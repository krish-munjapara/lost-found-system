"""
Guardian-Link Match Routes  (PROTECTED)
───────────────────────────────────────
AI match results. Requires authentication.
Admin sees all matches; User sees only matches related to their reports.

MATCH STATUS WORKFLOW:
  - Pending    → Match detected by AI, awaiting admin verification
  - Confirmed  → Admin has verified the match as correct
  - Rejected   → Admin has rejected the match as incorrect

CROSS-USER MATCHING:
  Match documents store both reporter emails, making it
  possible to verify that every match is between two DIFFERENT users.
  Self-matches are blocked at creation time (children.py).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import get_db
from app.utils import serialize_doc, get_timestamp
from app.services import get_confidence_level
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/matches", tags=["Matches"])


# ──────────────────────────────────────────────
# GET /api/matches  ← PROTECTED
# ──────────────────────────────────────────────
@router.get("/")
async def get_matches(current_user: dict = Depends(get_current_user)):
    """
    Get AI match results.
    Admin → sees all matches.
    User  → sees only matches tied to reports they submitted.

    Each match is GUARANTEED to be cross-user (missing_reporter ≠ found_reporter).
    """
    db = get_db()
    is_admin = current_user.get("role") == "Admin"
    user_email = current_user["email"]

    if is_admin:
        # Admin sees all matches
        cursor = db.matches.find().sort("created_at", -1)
    else:
        # User sees only matches involving their reports
        cursor = db.matches.find({
            "$or": [
                {"missing_reporter": user_email},
                {"found_reporter": user_email},
            ]
        }).sort("created_at", -1)

    db_matches = await cursor.to_list(None)
    match_results = []

    for row in db_matches:
        # Validate cross-user integrity (safe-guard)
        if row.get("missing_reporter") == row.get("found_reporter"):
            continue  # Skip any (shouldn't exist) self-match

        missing_child = await db.children.find_one({"_id": row["missing_id"]})
        found_child = await db.children_found.find_one({"_id": row["found_id"]})

        if not missing_child or not found_child:
            continue

        # Use stored confidence or re-compute
        conf_label = row.get("confidence_label")
        conf_class = row.get("confidence_class")
        if not conf_label:
            conf_label, conf_class = get_confidence_level(row["score"])

        # Determine user-specific context message
        user_context = None
        if not is_admin:
            if row.get("missing_reporter") == user_email:
                user_context = {
                    "role": "lost_reporter",
                    "heading": "Possible match found for your missing child",
                    "detail": (
                        f"A found child matches your report for \"{missing_child.get('name', 'Unknown')}\" "
                        f"with {conf_label.lower()} ({row['score']:.1f}% similarity). "
                        f"Found at: {found_child.get('location', 'Unknown')}."
                    ),
                }
            elif row.get("found_reporter") == user_email:
                user_context = {
                    "role": "found_reporter",
                    "heading": "This child may match a reported missing case",
                    "detail": (
                        f"The child you reported found (\"{found_child.get('name', 'Unknown')}\") "
                        f"matches missing child \"{missing_child.get('name', 'Unknown')}\" "
                        f"with {conf_label.lower()} ({row['score']:.1f}% similarity)."
                    ),
                }

        match_results.append({
            "id": str(row["_id"]),
            "score": row["score"],
            "confidence_label": conf_label,
            "confidence_class": conf_class,
            "status": row.get("status", "Pending"),
            "admin_notes": row.get("admin_notes", ""),
            "reviewed_at": row.get("reviewed_at", None),
            "timestamp": row.get("created_at", ""),
            "missing_reporter": row.get("missing_reporter", ""),
            "found_reporter": row.get("found_reporter", ""),
            "user_context": user_context,
            "missing": {
                "name": missing_child.get("name"),
                "age": missing_child.get("age"),
                "gender": missing_child.get("gender"),
                "location": missing_child.get("location"),
                "description": missing_child.get("description", ""),
                "image": missing_child.get("image"),
                "reporter_email": missing_child.get("reporter_email", ""),
            },
            "found": {
                "name": found_child.get("name"),
                "age": found_child.get("age"),
                "gender": found_child.get("gender"),
                "location": found_child.get("location"),
                "description": found_child.get("description", ""),
                "image": found_child.get("image"),
                "reporter_email": found_child.get("reporter_email", ""),
            }
        })

    return match_results


# ──────────────────────────────────────────────
# GET /api/matches/{match_id}  ← PROTECTED
# Get detailed match information
# ──────────────────────────────────────────────
@router.get("/{match_id}")
async def get_match_detail(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed information for a specific match."""
    db = get_db()

    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid match ID")

    match = await db.matches.find_one({"_id": oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Verify access: Admin sees all, User sees only their matches
    is_admin = current_user.get("role") == "Admin"
    user_email = current_user["email"]

    if not is_admin:
        if match.get("missing_reporter") != user_email and match.get("found_reporter") != user_email:
            raise HTTPException(status_code=403, detail="Access denied")

    missing_child = await db.children.find_one({"_id": match["missing_id"]})
    found_child = await db.children_found.find_one({"_id": match["found_id"]})

    conf_label = match.get("confidence_label")
    conf_class = match.get("confidence_class")
    if not conf_label:
        conf_label, conf_class = get_confidence_level(match["score"])

    return {
        "id": str(match["_id"]),
        "score": match["score"],
        "confidence_label": conf_label,
        "confidence_class": conf_class,
        "status": match.get("status", "Pending"),
        "admin_notes": match.get("admin_notes", ""),
        "reviewed_at": match.get("reviewed_at", None),
        "timestamp": match.get("created_at", ""),
        "missing_reporter": match.get("missing_reporter", ""),
        "found_reporter": match.get("found_reporter", ""),
        "missing": serialize_doc(missing_child) if missing_child else None,
        "found": serialize_doc(found_child) if found_child else None,
    }


# ──────────────────────────────────────────────
# PUT /api/matches/{match_id}/status  ← ADMIN ONLY
# Confirm or reject a match
# ──────────────────────────────────────────────
@router.put("/{match_id}/status")
async def update_match_status(
    match_id: str,
    current_user: dict = Depends(require_admin),
):
    """
    Update match status (Admin only).
    Body: { "status": "Confirmed" | "Rejected", "admin_notes": "optional notes" }
    """
    from fastapi import Request
    db = get_db()

    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid match ID")

    match = await db.matches.find_one({"_id": oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # We'll read status from query params since this is simpler
    return {"detail": "Use the dedicated confirm/reject endpoints instead"}


# ──────────────────────────────────────────────
# PUT /api/matches/{match_id}/confirm  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.put("/{match_id}/confirm")
async def confirm_match(
    match_id: str,
    current_user: dict = Depends(require_admin),
):
    """Confirm a match as valid. Admin only."""
    db = get_db()

    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid match ID")

    match = await db.matches.find_one({"_id": oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Update match status
    await db.matches.update_one(
        {"_id": oid},
        {"$set": {
            "status": "Confirmed",
            "reviewed_by": current_user["email"],
            "reviewed_at": get_timestamp(),
        }}
    )

    # Update the missing child status
    await db.children.update_one(
        {"_id": match["missing_id"]},
        {"$set": {"status": "Confirmed Match"}}
    )

    # Notify both users about the confirmation
    timestamp = get_timestamp()
    missing_reporter = match.get("missing_reporter", "")
    found_reporter = match.get("found_reporter", "")

    if missing_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": missing_reporter,
            "type": "match_confirmed",
            "title": "✅ Match Confirmed by Admin",
            "message": (
                f"The match between your missing child \"{match.get('missing_child_name', 'Unknown')}\" "
                f"and found child \"{match.get('found_child_name', 'Unknown')}\" "
                f"has been CONFIRMED by an administrator. Please coordinate for reunion."
            ),
            "match_id": match_id,
            "match_score": match["score"],
            "read": False,
            "created_at": timestamp,
        })

    if found_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": found_reporter,
            "type": "match_confirmed",
            "title": "✅ Match Confirmed by Admin",
            "message": (
                f"The match between found child \"{match.get('found_child_name', 'Unknown')}\" "
                f"and missing child \"{match.get('missing_child_name', 'Unknown')}\" "
                f"has been CONFIRMED by an administrator."
            ),
            "match_id": match_id,
            "match_score": match["score"],
            "read": False,
            "created_at": timestamp,
        })

    return {"success": True, "message": "Match confirmed successfully", "status": "Confirmed"}


# ──────────────────────────────────────────────
# PUT /api/matches/{match_id}/reject  ← ADMIN ONLY
# ──────────────────────────────────────────────
@router.put("/{match_id}/reject")
async def reject_match(
    match_id: str,
    current_user: dict = Depends(require_admin),
):
    """Reject a match as invalid. Admin only."""
    db = get_db()

    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid match ID")

    match = await db.matches.find_one({"_id": oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Update match status
    await db.matches.update_one(
        {"_id": oid},
        {"$set": {
            "status": "Rejected",
            "reviewed_by": current_user["email"],
            "reviewed_at": get_timestamp(),
        }}
    )

    # Revert the missing child status back to Pending
    await db.children.update_one(
        {"_id": match["missing_id"]},
        {"$set": {"status": "Pending"}}
    )

    # Notify users about the rejection
    timestamp = get_timestamp()
    missing_reporter = match.get("missing_reporter", "")
    found_reporter = match.get("found_reporter", "")

    if missing_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": missing_reporter,
            "type": "match_rejected",
            "title": "❌ Match Reviewed — Not a Match",
            "message": (
                f"After review, the match between your missing child "
                f"\"{match.get('missing_child_name', 'Unknown')}\" and found child "
                f"\"{match.get('found_child_name', 'Unknown')}\" has been determined "
                f"to NOT be a valid match. The system will continue searching."
            ),
            "match_id": match_id,
            "read": False,
            "created_at": timestamp,
        })

    if found_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": found_reporter,
            "type": "match_rejected",
            "title": "❌ Match Reviewed — Not a Match",
            "message": (
                f"After review, the found child \"{match.get('found_child_name', 'Unknown')}\" "
                f"is NOT a match for missing child \"{match.get('missing_child_name', 'Unknown')}\". "
                f"Thank you for your report."
            ),
            "match_id": match_id,
            "read": False,
            "created_at": timestamp,
        })

    return {"success": True, "message": "Match rejected", "status": "Rejected"}


# ──────────────────────────────────────────────
# GET /api/matches/stats/summary  ← PROTECTED
# Match statistics
# ──────────────────────────────────────────────
@router.get("/stats/summary")
async def get_match_stats(current_user: dict = Depends(get_current_user)):
    """Get match statistics summary."""
    db = get_db()
    is_admin = current_user.get("role") == "Admin"
    user_email = current_user["email"]

    if is_admin:
        base_query = {}
    else:
        base_query = {
            "$or": [
                {"missing_reporter": user_email},
                {"found_reporter": user_email},
            ]
        }

    total = await db.matches.count_documents(base_query)
    pending = await db.matches.count_documents({**base_query, "status": "Pending"})
    confirmed = await db.matches.count_documents({**base_query, "status": "Confirmed"})
    rejected = await db.matches.count_documents({**base_query, "status": "Rejected"})

    # High/medium/low confidence counts
    all_matches = await db.matches.find(base_query).to_list(None)
    high = sum(1 for m in all_matches if m.get("score", 0) >= 75)
    medium = sum(1 for m in all_matches if 50 <= m.get("score", 0) < 75)
    low = sum(1 for m in all_matches if m.get("score", 0) < 50)

    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "rejected": rejected,
        "high_confidence": high,
        "medium_confidence": medium,
        "low_confidence": low,
    }
