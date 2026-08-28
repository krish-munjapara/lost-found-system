"""
Guardian-Link Children Routes
"""

from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, BackgroundTasks

from app.database import get_db
from app.utils import serialize_doc, get_timestamp, sanitize_child
from app.utils.file_utils import (
    read_and_validate_upload, compress_image, generate_filename,
)
from app.services import upload_image
from app.services.embedding_service import process_report_ai_pipeline
from app.dependencies import get_current_user
from app.models.location_model import Location

router = APIRouter(prefix="/api/children", tags=["Children"])

PRIVATE_PROJECTION = {"encoding": 0}


def _optional_form_float(value: str | None) -> float | None:
    if value is None or not str(value).strip():
        return None
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def _parse_report_date(value: str | None, field_label: str) -> datetime:
    if not value or not str(value).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_label} is required",
        )
    raw = str(value).strip()
    try:
        if "T" in raw:
            normalized = raw.replace("Z", "+00:00")
            return datetime.fromisoformat(normalized)
        return datetime.strptime(raw[:10], "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid {field_label} format. Use YYYY-MM-DD.",
        ) from exc


@router.post("/report-lost")
async def report_lost(
    background_tasks: BackgroundTasks,
    child_name: str = Form(...),
    age: int = Form(..., ge=0, le=18),
    gender: str = Form(...),
    country: str = Form(default="India"),
    state: str = Form(...),
    district: str = Form(default=""),
    city: str = Form(...),
    address: str = Form(default=""),
    pincode: str = Form(default=""),
    latitude: str = Form(default=""),
    longitude: str = Form(default=""),
    date_missing: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    print(f"[REPORT_LOST_START]")
    
    try:
        db = get_db()
        reporter_email = current_user["email"]
        lat = _optional_form_float(latitude)
        lng = _optional_form_float(longitude)
        missing_at = _parse_report_date(date_missing, "date_missing")

        print(f"[REPORT_LOST_AUTH_OK]")
        print(f"reporter_email={reporter_email}")

        # Validate and read upload
        raw, content_type = await read_and_validate_upload(photo)
        print(f"[REPORT_LOST_IMAGE_VALIDATED]")
        print(f"content_type={content_type}")
        print(f"image_size={len(raw)}")
        
        compressed = compress_image(raw)
        filename = generate_filename(content_type)
        folder = "lost"
        
        print(f"[REPORT_LOST_CLOUDINARY_START]")
        storage = upload_image(compressed, folder, filename)
        print(f"[REPORT_LOST_CLOUDINARY_SUCCESS]")
        print(f"image_url={storage['image_url']}")

        # Build structured location
        location_structured = Location(
            country=country,
            state=state,
            district=district if district else None,
            city=city,
            address=address if address else None,
            pincode=pincode if pincode else None,
            latitude=lat,
            longitude=lng,
        )
        
        # Build geo_point if coordinates provided
        geo_point = None
        if lat is not None and lng is not None:
            geo_point = {
                "type": "Point",
                "coordinates": [lng, lat]
            }

        child_doc = {
            "name": child_name,
            "age": str(age),
            "gender": gender,
            "location": location_structured.to_legacy_string(),
            "location_structured": {
                **location_structured.model_dump(),
                "geo_point": geo_point
            },
            "location_version": 2,
            "date_missing": missing_at,
            "description": description,
            "image_url": storage["image_url"],
            "public_id": storage["public_id"],
            "storage": "cloudinary",
            "status": "Pending",
            "reporter_email": reporter_email,
            "user_id": current_user.get("id"),
            "created_at": get_timestamp(),
            "ai_processing_status": "queued",
            "embedding_status": "pending",
        }
        
        print(f"[REPORT_LOST_DB_CREATE_START]")
        result = await db.children.insert_one(child_doc)
        child_id = str(result.inserted_id)
        print(f"[REPORT_LOST_DB_CREATE_SUCCESS]")
        print(f"child_id={child_id}")

        await db.notifications.insert_one({
            "type": "new_report",
            "message": f"New missing child reported: {child_name}",
            "child_name": child_name,
            "child_age": str(age),
            "child_location": location_structured.to_legacy_string(),
            "reporter_email": reporter_email,
            "created_at": get_timestamp(),
        })

        # Create persistent AI job
        print(f"[REPORT_LOST_CREATE_AI_JOB]")
        from app.services.job_service import create_ai_job
        job_id = await create_ai_job(
            report_id=child_id,
            report_type="missing",
            report_collection_name="children",
        )
        print(f"[REPORT_LOST_AI_JOB_CREATED] job_id={job_id}")

        print(f"[REPORT_LOST_COMPLETE]")
        return {
            "success": True,
            "message": "Missing child report submitted successfully. AI matching is in progress.",
            "id": child_id,
            "ai_processing_status": "queued",
        }
        
    except Exception as e:
        print(f"[REPORT_LOST_ERROR]")
        print(f"error_type={type(e).__name__}")
        print(f"error_message={str(e)}")
        import traceback
        print(f"traceback={traceback.format_exc()}")
        raise


@router.post("/report-found")
async def report_found(
    background_tasks: BackgroundTasks,
    child_name: str = Form(default="Unknown"),
    age: int = Form(..., ge=0, le=18),
    gender: str = Form(...),
    country: str = Form(default="India"),
    state: str = Form(...),
    district: str = Form(default=""),
    city: str = Form(...),
    address: str = Form(default=""),
    pincode: str = Form(default=""),
    latitude: str = Form(default=""),
    longitude: str = Form(default=""),
    date_found: str = Form(...),
    description: str = Form(...),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    print(f"[REPORT_FOUND_START]")
    
    try:
        db = get_db()
        reporter_email = current_user["email"]
        lat = _optional_form_float(latitude)
        lng = _optional_form_float(longitude)
        found_at = _parse_report_date(date_found, "date_found")
        resolved_name = child_name.strip() if child_name and child_name.strip() else "Unknown"

        print(f"[REPORT_FOUND_AUTH_OK]")
        print(f"reporter_email={reporter_email}")

        raw, content_type = await read_and_validate_upload(photo)
        print(f"[REPORT_FOUND_IMAGE_VALIDATED]")
        print(f"content_type={content_type}")
        print(f"image_size={len(raw)}")
        
        compressed = compress_image(raw)
        filename = generate_filename(content_type)
        folder = "found"
        
        print(f"[REPORT_FOUND_CLOUDINARY_START]")
        storage = upload_image(compressed, folder, filename)
        print(f"[REPORT_FOUND_CLOUDINARY_SUCCESS]")
        print(f"image_url={storage['image_url']}")

        location_structured = Location(
            country=country,
            state=state,
            district=district if district else None,
            city=city,
            address=address if address else None,
            pincode=pincode if pincode else None,
            latitude=lat,
            longitude=lng,
        )
        
        geo_point = None
        if lat is not None and lng is not None:
            geo_point = {
                "type": "Point",
                "coordinates": [lng, lat]
            }

        found_doc = {
            "name": resolved_name,
            "age": str(age),
            "gender": gender,
            "location": location_structured.to_legacy_string(),
            "location_structured": {
                **location_structured.model_dump(),
                "geo_point": geo_point
            },
            "location_version": 2,
            "date_found": found_at,
            "description": description,
            "image_url": storage["image_url"],
            "public_id": storage["public_id"],
            "storage": "cloudinary",
            "status": "Pending",
            "reporter_email": reporter_email,
            "user_id": current_user.get("id"),
            "created_at": get_timestamp(),
            "ai_processing_status": "queued",
            "embedding_status": "pending",
        }
        
        print(f"[REPORT_FOUND_DB_CREATE_START]")
        result = await db.children_found.insert_one(found_doc)
        found_id = str(result.inserted_id)
        print(f"[REPORT_FOUND_DB_CREATE_SUCCESS]")
        print(f"found_id={found_id}")

        # Create persistent AI job
        print(f"[REPORT_FOUND_CREATE_AI_JOB]")
        from app.services.job_service import create_ai_job
        job_id = await create_ai_job(
            report_id=found_id,
            report_type="found",
            report_collection_name="children_found",
        )
        print(f"[REPORT_FOUND_AI_JOB_CREATED] job_id={job_id}")

        print(f"[REPORT_FOUND_COMPLETE]")
        return {
            "success": True,
            "message": "Found child report submitted successfully. AI matching is in progress.",
            "id": found_id,
            "ai_processing_status": "queued",
        }
        
    except Exception as e:
        print(f"[REPORT_FOUND_ERROR]")
        print(f"error_type={type(e).__name__}")
        print(f"error_message={str(e)}")
        import traceback
        print(f"traceback={traceback.format_exc()}")
        raise


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
