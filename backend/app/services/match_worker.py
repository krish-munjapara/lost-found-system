"""Background AI matching pipeline."""

from bson import ObjectId

from app.config import MATCH_THRESHOLD, TOP_MATCH_LIMIT
from app.database import get_db
from app.services.email_service import send_match_notification_email
from app.services.face_matcher import compute_similarity, get_confidence_level
from app.utils import get_timestamp


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
    timestamp = get_timestamp()
    notifications = []

    if missing_reporter:
        title = "Possible Match Found for Your Missing Child"
        message = (
            f"A found child \"{found_child_name}\" matches your missing child "
            f"\"{missing_child_name}\" with {conf_label.lower()} ({score:.1f}%)."
        )
        notifications.append({
            "recipient_email": missing_reporter,
            "type": "match_lost_reporter",
            "title": f"🔔 {title}",
            "message": message,
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
        send_match_notification_email(missing_reporter, title, message)

    if found_reporter:
        title = "Child May Match a Missing Case"
        message = (
            f"Your found child \"{found_child_name}\" may match missing child "
            f"\"{missing_child_name}\" ({score:.1f}%)."
        )
        notifications.append({
            "recipient_email": found_reporter,
            "type": "match_found_reporter",
            "title": f"🔍 {title}",
            "message": message,
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
        send_match_notification_email(found_reporter, title, message)

    admin_cursor = db.users.find({"role": "Admin"})
    async for admin in admin_cursor:
        notifications.append({
            "recipient_email": admin["email"],
            "type": "match_admin_review",
            "title": "⚠️ New AI Match Requires Verification",
            "message": (
                f"AI detected {conf_label.lower()} match ({score:.1f}%) between "
                f"\"{missing_child_name}\" and \"{found_child_name}\"."
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

    if notifications:
        await db.user_notifications.insert_many(notifications)


async def run_lost_matching(child_id: str, reporter_email: str, encoding: str, child_name: str, filename: str, location: str):
    db = get_db()
    oid = ObjectId(child_id)

    candidates = await db.children_found.find({
        "encoding": {"$ne": None},
        "reporter_email": {"$ne": reporter_email},
    }).to_list(None)

    scored = []
    for fc in candidates:
        score = compute_similarity(encoding, fc.get("encoding"))
        if score >= MATCH_THRESHOLD:
            conf_label, conf_class = get_confidence_level(score)
            scored.append((score, conf_label, conf_class, fc))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:TOP_MATCH_LIMIT]

    for score, conf_label, conf_class, fc in top:
        match_result = await db.matches.insert_one({
            "missing_id": oid,
            "found_id": fc["_id"],
            "score": score,
            "confidence_label": conf_label,
            "confidence_class": conf_class,
            "status": "Pending",
            "missing_reporter": reporter_email,
            "found_reporter": fc.get("reporter_email", ""),
            "missing_child_name": child_name,
            "found_child_name": fc.get("name", "Unknown"),
            "missing_image": filename,
            "found_image": fc.get("image", ""),
            "missing_location": location,
            "found_location": fc.get("location", ""),
            "created_at": get_timestamp(),
        })
        await _create_match_notifications(
            db, match_result.inserted_id, child_name, fc.get("name", "Unknown"),
            reporter_email, fc.get("reporter_email", ""), score, conf_label,
            filename, fc.get("image", ""), location, fc.get("location", "Unknown"),
        )

    if top:
        await db.children.update_one({"_id": oid}, {"$set": {"status": "Ai Matches"}})


async def run_found_matching(found_id: str, reporter_email: str, encoding: str, child_name: str, filename: str, location: str):
    db = get_db()
    oid = ObjectId(found_id)

    candidates = await db.children.find({
        "encoding": {"$ne": None},
        "reporter_email": {"$ne": reporter_email},
    }).to_list(None)

    scored = []
    for mc in candidates:
        score = compute_similarity(encoding, mc.get("encoding"))
        if score >= MATCH_THRESHOLD:
            conf_label, conf_class = get_confidence_level(score)
            scored.append((score, conf_label, conf_class, mc))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:TOP_MATCH_LIMIT]

    for score, conf_label, conf_class, mc in top:
        match_result = await db.matches.insert_one({
            "missing_id": mc["_id"],
            "found_id": oid,
            "score": score,
            "confidence_label": conf_label,
            "confidence_class": conf_class,
            "status": "Pending",
            "missing_reporter": mc.get("reporter_email", ""),
            "found_reporter": reporter_email,
            "missing_child_name": mc.get("name", "Unknown"),
            "found_child_name": child_name,
            "missing_image": mc.get("image", ""),
            "found_image": filename,
            "missing_location": mc.get("location", ""),
            "found_location": location,
            "created_at": get_timestamp(),
        })
        await _create_match_notifications(
            db, match_result.inserted_id, mc.get("name", "Unknown"), child_name,
            mc.get("reporter_email", ""), reporter_email, score, conf_label,
            mc.get("image", ""), filename, mc.get("location", "Unknown"), location,
        )
        await db.children.update_one({"_id": mc["_id"]}, {"$set": {"status": "Ai Matches"}})


