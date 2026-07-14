"""
Guardian-Link Children Routes
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, BackgroundTasks

from app.database import get_db
from app.utils import serialize_doc, get_timestamp, sanitize_child
from app.utils.file_utils import (
    read_and_validate_upload, compress_image, generate_filename,
)
from app.services import upload_image
from app.services.embedding_service import create_embedding_record_for_report
from app.services.matching_service import run_matching_for_report
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/children", tags=["Children"])

PRIVATE_PROJECTION = {"encoding": 0}


@router.post("/report-lost")
async def report_lost(
    background_tasks: BackgroundTasks,
    child_name: str = Form(...),
    age: str = Form(...),
    gender: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    reporter_email = current_user["email"]

    raw, content_type = await read_and_validate_upload(photo)
    compressed = compress_image(raw)
    filename = generate_filename(content_type)
    folder = "lost"
    storage = upload_image(compressed, folder, filename)

    child_doc = {
        "name": child_name,
        "age": age,
        "gender": gender,
        "location": location,
        "description": description,
        "image_url": storage["image_url"],
        "public_id": storage["public_id"],
        "storage": "cloudinary",
        "status": "Pending",
        "reporter_email": reporter_email,
        "created_at": get_timestamp(),
    }
    result = await db.children.insert_one(child_doc)
    child_id = str(result.inserted_id)

    await db.notifications.insert_one({
        "type": "new_report",
        "message": f"New missing child reported: {child_name}",
        "child_name": child_name,
        "child_age": age,
        "child_location": location,
        "reporter_email": reporter_email,
        "created_at": get_timestamp(),
    })

    embedding_result = await create_embedding_record_for_report(
        report_id=child_id,
        report_type="missing",
        user_id=current_user.get("id") or reporter_email,
        image_input=compressed,
        report_collection_name="children",
    )

    if embedding_result["status"] == "failed":
        message = "Report submitted successfully. Face detection failed. Admin review required."
    else:
        message = "Missing child report submitted successfully."
        print(f"Matching started for report: {child_id}")
        await run_matching_for_report(
            report_id=child_id,
            report_type="missing",
            report_collection_name="children",
            candidate_collection_name="children_found",
        )

    return {
        "success": True,
        "message": message,
        "id": child_id,
        "embedding_status": embedding_result["status"],
    }


@router.post("/report-found")
async def report_found(
    background_tasks: BackgroundTasks,
    child_name: str = Form(default="Unknown"),
    age: str = Form(...),
    gender: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    reporter_email = current_user["email"]

    raw, content_type = await read_and_validate_upload(photo)
    compressed = compress_image(raw)
    filename = generate_filename(content_type)
    folder = "found"
    storage = upload_image(compressed, folder, filename)

    found_doc = {
        "name": child_name,
        "age": age,
        "gender": gender,
        "location": location,
        "description": description,
        "image_url": storage["image_url"],
        "public_id": storage["public_id"],
        "storage": "cloudinary",
        "status": "Pending",
        "reporter_email": reporter_email,
        "created_at": get_timestamp(),
    }
    result = await db.children_found.insert_one(found_doc)
    found_id = str(result.inserted_id)

    embedding_result = await create_embedding_record_for_report(
        report_id=found_id,
        report_type="found",
        user_id=current_user.get("id") or reporter_email,
        image_input=compressed,
        report_collection_name="children_found",
    )

    if embedding_result["status"] == "failed":
        message = "Report submitted successfully. Face detection failed. Admin review required."
    else:
        message = "Found child report submitted successfully."
        print(f"Matching started for report: {found_id}")
        await run_matching_for_report(
            report_id=found_id,
            report_type="found",
            report_collection_name="children_found",
            candidate_collection_name="children",
        )

    return {
        "success": True,
        "message": message,
        "id": found_id,
        "embedding_status": embedding_result["status"],
    }


@router.get("/missing")
async def get_missing_children(current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = {} if current_user.get("role") == "Admin" else {"reporter_email": current_user["email"]}
    cursor = db.children.find(query, PRIVATE_PROJECTION).sort("created_at", -1)
    return [serialize_doc(doc) async for doc in cursor]


@router.get("/found")
async def get_found_children(current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = {} if current_user.get("role") == "Admin" else {"reporter_email": current_user["email"]}
    cursor = db.children_found.find(query, PRIVATE_PROJECTION).sort("created_at", -1)
    return [serialize_doc(doc) async for doc in cursor]
