"""
Guardian-Link Children Routes  (PROTECTED)
───────────────────────────────────────────
All report submission endpoints require authentication.
Each report stores the reporter_email so data can be
filtered per-user in the /api/user/my-reports endpoint.

CROSS-USER MATCHING RULE:
  A user's own "lost" report is NEVER matched against
  their own "found" report. AI matching only runs
  across reports from DIFFERENT users.

NOTIFICATION WORKFLOW:
  When a match is found:
  1. Lost reporter → primary notification ("Possible match found for your missing child")
  2. Found reporter → secondary notification ("This child may match a reported missing case")
  3. Admin → verification notification for review & approval
"""

import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from werkzeug.utils import secure_filename
from datetime import datetime

from app.database import get_db
from app.utils import serialize_doc, get_timestamp
from app.config import LOST_UPLOAD_PATH, FOUND_UPLOAD_PATH, MATCH_THRESHOLD
from app.services import get_face_encoding, compute_similarity, get_confidence_level
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/children", tags=["Children"])


# ──────────────────────────────────────────────
# Helper: Create notifications for a match
# ──────────────────────────────────────────────
async def _create_match_notifications(
    db,
    match_id,
    missing_child_name: str,
    found_child_name: str,
    missing_reporter: str,
    found_reporter: str,
    score: float,
    conf_label: str,
    missing_image: str,
    found_image: str,
    missing_location: str,
    found_location: str,
):
    """
    Create notifications for BOTH users and admin when a match is detected.
    """
    timestamp = get_timestamp()

    # ─── 1. Notify the LOST report user (primary notification) ───
    if missing_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": missing_reporter,
            "type": "match_lost_reporter",
            "title": "🔔 Possible Match Found for Your Missing Child",
            "message": (
                f"Great news! A found child report \"{found_child_name}\" "
                f"has a {conf_label.lower()} match ({score:.1f}%) "
                f"with your missing child \"{missing_child_name}\". "
                f"Found location: {found_location}."
            ),
            "match_id": str(match_id),
            "match_score": score,
            "confidence_label": conf_label,
            "missing_child_name": missing_child_name,
            "found_child_name": found_child_name,
            "missing_image": missing_image,
            "found_image": found_image,
            "found_location": found_location,
            "read": False,
            "created_at": timestamp,
        })

    # ─── 2. Notify the FOUND report user (secondary notification) ───
    if found_reporter:
        await db.user_notifications.insert_one({
            "recipient_email": found_reporter,
            "type": "match_found_reporter",
            "title": "🔍 This Child May Match a Reported Missing Case",
            "message": (
                f"The child you reported found (\"{found_child_name}\") "
                f"has a {conf_label.lower()} match ({score:.1f}%) "
                f"with a missing child report \"{missing_child_name}\". "
                f"Last seen at: {missing_location}."
            ),
            "match_id": str(match_id),
            "match_score": score,
            "confidence_label": conf_label,
            "missing_child_name": missing_child_name,
            "found_child_name": found_child_name,
            "missing_image": missing_image,
            "found_image": found_image,
            "missing_location": missing_location,
            "read": False,
            "created_at": timestamp,
        })

    # ─── 3. Notify ALL admins for verification ───
    admin_cursor = db.users.find({"role": "Admin"})
    async for admin in admin_cursor:
        await db.user_notifications.insert_one({
            "recipient_email": admin["email"],
            "type": "match_admin_review",
            "title": "⚠️ New AI Match Requires Verification",
            "message": (
                f"AI detected a {conf_label.lower()} match ({score:.1f}%) "
                f"between missing child \"{missing_child_name}\" "
                f"and found child \"{found_child_name}\". "
                f"Please review and verify this match."
            ),
            "match_id": str(match_id),
            "match_score": score,
            "confidence_label": conf_label,
            "missing_child_name": missing_child_name,
            "found_child_name": found_child_name,
            "missing_reporter": missing_reporter,
            "found_reporter": found_reporter,
            "missing_image": missing_image,
            "found_image": found_image,
            "read": False,
            "created_at": timestamp,
        })


# ──────────────────────────────────────────────
# POST /api/children/report-lost  ← PROTECTED
# ──────────────────────────────────────────────
@router.post("/report-lost")
async def report_lost(
    child_name: str = Form(...),
    age: str = Form(...),
    gender: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),    # ← JWT required
):
    """
    Report a missing child. Requires authentication.
    After saving, runs cross-user AI matching against found
    children reported by OTHER users only.
    """
    db = get_db()
    reporter_email = current_user["email"]

    # Save uploaded photo
    filename = secure_filename(photo.filename)
    filepath = os.path.join(LOST_UPLOAD_PATH, filename)
    content = await photo.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Get face encoding
    encoding = get_face_encoding(filepath)
    if encoding is None:
        os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No clear face detected in the image. Please upload a clear photo."
        )

    # Save child document — includes reporter_email for ownership tracking
    child_doc = {
        "name": child_name,
        "age": age,
        "gender": gender,
        "location": location,
        "description": description,
        "image": filename,
        "encoding": encoding,
        "status": "Pending",
        "reporter_email": reporter_email,       # ← Track who reported
        "created_at": get_timestamp()
    }

    result = await db.children.insert_one(child_doc)
    child_id = result.inserted_id

    # Create global notification
    await db.notifications.insert_one({
        "type": "new_report",
        "message": f"New missing child reported: {child_name}",
        "child_name": child_name,
        "child_age": age,
        "child_location": location,
        "reporter_email": reporter_email,
        "created_at": get_timestamp()
    })

    # ─────────────────────────────────────────
    # CROSS-USER AI MATCHING
    # Compare this lost report ONLY against found
    # reports submitted by OTHER users.
    # ─────────────────────────────────────────
    found_children = await db.children_found.find({
        "encoding": {"$ne": None},
        "reporter_email": {"$ne": reporter_email}    # ← SKIP same user
    }).to_list(None)

    matches_found = 0
    match_details = []
    for fc in found_children:
        score = compute_similarity(encoding, fc.get("encoding"))
        if score >= MATCH_THRESHOLD:
            conf_label, conf_class = get_confidence_level(score)

            match_result = await db.matches.insert_one({
                "missing_id": child_id,
                "found_id": fc["_id"],
                "score": score,
                "confidence_label": conf_label,
                "confidence_class": conf_class,
                "status": "Pending",              # ← Match status for admin review
                "missing_reporter": reporter_email,
                "found_reporter": fc.get("reporter_email", ""),
                "missing_child_name": child_name,
                "found_child_name": fc.get("name", "Unknown"),
                "missing_image": filename,
                "found_image": fc.get("image", ""),
                "missing_location": location,
                "found_location": fc.get("location", ""),
                "created_at": get_timestamp()
            })

            await db.children.update_one(
                {"_id": child_id},
                {"$set": {"status": "Ai Matches"}}
            )

            # ─── Notify BOTH users + Admin ───
            await _create_match_notifications(
                db=db,
                match_id=match_result.inserted_id,
                missing_child_name=child_name,
                found_child_name=fc.get("name", "Unknown"),
                missing_reporter=reporter_email,
                found_reporter=fc.get("reporter_email", ""),
                score=score,
                conf_label=conf_label,
                missing_image=filename,
                found_image=fc.get("image", ""),
                missing_location=location,
                found_location=fc.get("location", "Unknown"),
            )

            match_details.append({
                "found_child_name": fc.get("name", "Unknown"),
                "score": score,
                "confidence": conf_label,
            })

            matches_found += 1

    return {
        "success": True,
        "message": "Missing child report submitted",
        "id": str(child_id),
        "matches_found": matches_found,
        "match_details": match_details,
    }


# ──────────────────────────────────────────────
# POST /api/children/report-found  ← PROTECTED
# ──────────────────────────────────────────────
@router.post("/report-found")
async def report_found(
    child_name: str = Form(default="Unknown"),
    age: str = Form(...),
    gender: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),    # ← JWT required
):
    """
    Report a found child. Requires authentication.
    After saving, runs cross-user AI matching against lost
    children reported by OTHER users only.
    """
    db = get_db()
    reporter_email = current_user["email"]

    # Save uploaded photo
    filename = secure_filename(photo.filename)
    filepath = os.path.join(FOUND_UPLOAD_PATH, filename)
    content = await photo.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Get face encoding
    encoding = get_face_encoding(filepath)
    if encoding is None:
        os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No clear face detected in the image. Please upload a clear photo."
        )

    # Save found child document — includes reporter_email
    found_doc = {
        "name": child_name,
        "age": age,
        "gender": gender,
        "location": location,
        "description": description,
        "image": filename,
        "encoding": encoding,
        "reporter_email": reporter_email,       # ← Track who reported
        "created_at": get_timestamp()
    }

    result = await db.children_found.insert_one(found_doc)
    found_id = result.inserted_id

    # ─────────────────────────────────────────
    # CROSS-USER AI MATCHING
    # Compare this found report ONLY against lost
    # reports submitted by OTHER users.
    # ─────────────────────────────────────────
    missing_children = await db.children.find({
        "encoding": {"$ne": None},
        "reporter_email": {"$ne": reporter_email}    # ← SKIP same user
    }).to_list(None)

    matches_found = 0
    match_details = []
    for mc in missing_children:
        score = compute_similarity(encoding, mc.get("encoding"))
        if score >= MATCH_THRESHOLD:
            conf_label, conf_class = get_confidence_level(score)

            match_result = await db.matches.insert_one({
                "missing_id": mc["_id"],
                "found_id": found_id,
                "score": score,
                "confidence_label": conf_label,
                "confidence_class": conf_class,
                "status": "Pending",              # ← Match status for admin review
                "missing_reporter": mc.get("reporter_email", ""),
                "found_reporter": reporter_email,
                "missing_child_name": mc.get("name", "Unknown"),
                "found_child_name": child_name,
                "missing_image": mc.get("image", ""),
                "found_image": filename,
                "missing_location": mc.get("location", ""),
                "found_location": location,
                "created_at": get_timestamp()
            })

            await db.children.update_one(
                {"_id": mc["_id"]},
                {"$set": {"status": "Ai Matches"}}
            )

            # ─── Notify BOTH users + Admin ───
            await _create_match_notifications(
                db=db,
                match_id=match_result.inserted_id,
                missing_child_name=mc.get("name", "Unknown"),
                found_child_name=child_name,
                missing_reporter=mc.get("reporter_email", ""),
                found_reporter=reporter_email,
                score=score,
                conf_label=conf_label,
                missing_image=mc.get("image", ""),
                found_image=filename,
                missing_location=mc.get("location", "Unknown"),
                found_location=location,
            )

            match_details.append({
                "missing_child_name": mc.get("name", "Unknown"),
                "score": score,
                "confidence": conf_label,
            })

            matches_found += 1

    return {
        "success": True,
        "message": "Found child report submitted",
        "id": str(found_id),
        "matches_found": matches_found,
        "match_details": match_details,
    }


# ──────────────────────────────────────────────
# GET /api/children/missing  ← PROTECTED
# Admin sees ALL, User sees only their own
# ──────────────────────────────────────────────
@router.get("/missing")
async def get_missing_children(current_user: dict = Depends(get_current_user)):
    """
    Get missing children reports.
    Admin → sees all reports.
    User  → sees only their own reports.
    """
    db = get_db()

    if current_user.get("role") == "Admin":
        query = {}  # Admin sees everything
    else:
        query = {"reporter_email": current_user["email"]}  # User sees own data only

    cursor = db.children.find(query).sort("_id", -1)
    children = [serialize_doc(doc) async for doc in cursor]
    return children


# ──────────────────────────────────────────────
# GET /api/children/found  ← PROTECTED
# Admin sees ALL, User sees only their own
# ──────────────────────────────────────────────
@router.get("/found")
async def get_found_children(current_user: dict = Depends(get_current_user)):
    """
    Get found children reports.
    Admin → sees all reports.
    User  → sees only their own reports.
    """
    db = get_db()

    if current_user.get("role") == "Admin":
        query = {}
    else:
        query = {"reporter_email": current_user["email"]}

    cursor = db.children_found.find(query).sort("_id", -1)
    children = [serialize_doc(doc) async for doc in cursor]
    return children
