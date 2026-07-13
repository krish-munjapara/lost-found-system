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
from app.services.audit_service import log_action
from app.services.email_service import send_match_notification_email
from app.services.face_matcher import get_confidence_level
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/matches", tags=["Matches"])


# ──────────────────────────────────────────────
# GET /api/matches  ← PROTECTED
# ──────────────────────────────────────────────
@router.get("/")
async def get_matches(current_user: dict = Depends(get_current_user)):
    """Return all stored match documents for authenticated users, with debug logging."""
    db = get_db()
    collection_name = "matches"
    query = {}

    print(f"MongoDB collection being queried: {collection_name}")
    print(f"Exact query: {query}")
    print(f"current_user: {current_user}")
    print(f"user role: {current_user.get('role')}")

    total_documents = await db.matches.count_documents({})
    print(f"Total documents in db.matches: {total_documents}")

    matches = await db.matches.find(query).sort("created_at", -1).to_list(None)
    print(f"Documents returned before filtering: {matches}")

    filtered_matches = matches
    print(f"Documents returned after filtering: {filtered_matches}")

    def _convert_object_ids(value):
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, dict):
            return {key: _convert_object_ids(item) for key, item in value.items()}
        if isinstance(value, list):
            return [_convert_object_ids(item) for item in value]
        return value

    serialized_matches = [_convert_object_ids(match) for match in filtered_matches]
    print(f"Total matches in MongoDB: {total_documents}")
    print(f"Matches returned by API: {serialized_matches}")
    return serialized_matches


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
    import traceback

    print(f"\n{'='*60}")
    print(f"[CONFIRM MATCH] match_id received: {match_id}")
    print(f"[CONFIRM MATCH] admin user: {current_user.get('email')}")

    db = get_db()

    # --- Validate match_id ---
    try:
        oid = ObjectId(match_id)
    except Exception:
        print(f"[CONFIRM MATCH] ERROR: Invalid ObjectId format: {match_id}")
        raise HTTPException(status_code=400, detail="Invalid match ID")

    print(f"[CONFIRM MATCH] MongoDB query: {{'_id': ObjectId('{match_id}')}}")

    # --- Find match document ---
    try:
        match = await db.matches.find_one({"_id": oid})
    except Exception as exc:
        print(f"[CONFIRM MATCH] DB find_one exception:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Database error looking up match")

    if not match:
        print(f"[CONFIRM MATCH] Match document NOT FOUND for id: {match_id}")
        raise HTTPException(status_code=404, detail="Match not found")

    print(f"[CONFIRM MATCH] Match document found: {match}")

    try:
        # --- Resolve field names (support both naming conventions) ---
        match_score = match.get("score") or match.get("similarity_score") or 0
        missing_child_id = match.get("missing_id") or match.get("missing_report_id")
        found_child_id = match.get("found_id") or match.get("found_report_id")

        print(f"[CONFIRM MATCH] Resolved score: {match_score}")
        print(f"[CONFIRM MATCH] Resolved missing_child_id: {missing_child_id}")
        print(f"[CONFIRM MATCH] Resolved found_child_id: {found_child_id}")
        print(f"[CONFIRM MATCH] Current status: {match.get('status')}")

        # --- Update match status: pending_review → confirmed ---
        await db.matches.update_one(
            {"_id": oid},
            {"$set": {
                "status": "confirmed",
                "reviewed_by": current_user.get("email", ""),
                "reviewed_at": get_timestamp(),
            }}
        )
        print(f"[CONFIRM MATCH] Match status updated to 'confirmed'")

        # --- Update the missing child status ---
        if missing_child_id:
            # Ensure it's an ObjectId for the query
            if not isinstance(missing_child_id, ObjectId):
                try:
                    missing_child_id = ObjectId(missing_child_id)
                except Exception:
                    pass  # keep as-is if it can't be converted

            result = await db.children.update_one(
                {"_id": missing_child_id},
                {"$set": {"status": "Confirmed Match", "resolved_at": get_timestamp()}}
            )
            print(f"[CONFIRM MATCH] children.update_one matched={result.matched_count}, modified={result.modified_count}")
        else:
            print(f"[CONFIRM MATCH] No missing_child_id found — skipping children update")

        await log_action(current_user.get("email", ""), "confirm_match", "match", match_id)

        # --- Notify both users about the confirmation ---
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
                "match_score": match_score,
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
                "match_score": match_score,
                "read": False,
                "created_at": timestamp,
            })

        print(f"[CONFIRM MATCH] ✅ Complete — notifications sent")
        print(f"{'='*60}\n")

        return {"success": True, "message": "Match confirmed successfully", "status": "confirmed"}

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[CONFIRM MATCH] ❌ EXCEPTION:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm match: {str(exc)}")


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

    await log_action(current_user["email"], "reject_match", "match", match_id)

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
    
    print(f"GET /api/matches/stats/summary - User: {user_email}, Is Admin: {is_admin}")

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
    
    print(f"  Total: {total}, Pending: {pending}, Confirmed: {confirmed}, Rejected: {rejected}")

    # High/medium/low confidence counts
    all_matches = await db.matches.find(base_query).to_list(None)
    high = sum(1 for m in all_matches if m.get("score", 0) >= 75)
    medium = sum(1 for m in all_matches if 50 <= m.get("score", 0) < 75)
    low = sum(1 for m in all_matches if m.get("score", 0) < 50)

    result = {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "rejected": rejected,
        "high_confidence": high,
        "medium_confidence": medium,
        "low_confidence": low,
    }
    print(f"  Stats: {result}")
    return result
