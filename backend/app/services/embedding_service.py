"""Face embedding persistence service for Guardian-Link."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from bson import ObjectId

from app.config import FACE_MODEL_NAME
from app.database import get_db
from app.utils import get_timestamp
from app.services.face_matcher import get_face_encoding


def log_event(event: str, **details: Any) -> None:
    """Emit a structured event log entry for observability."""
    payload = {"event": event, **details}
    print(f"[AI_LOG] {json.dumps(payload, default=str)}")


import numpy as np

def load_image_from_url_or_path(image_input: str | np.ndarray) -> np.ndarray | None:
    """Download image from HTTP(S) URL or load from path, decoding to numpy array using cv2.imdecode."""
    if isinstance(image_input, np.ndarray):
        print(f"[AI_IMAGE_DOWNLOAD] source=numpy_array shape={image_input.shape}")
        return image_input

    if isinstance(image_input, str):
        import cv2
        if image_input.startswith("http://") or image_input.startswith("https://"):
            # Truncate URL to avoid logging sensitive signed URLs
            url_prefix = image_input[:80] if len(image_input) > 80 else image_input
            print(f"[AI_IMAGE_DOWNLOAD_START] source=url url={url_prefix}...")
            try:
                import requests
                from urllib.parse import urlparse
                url_host = urlparse(image_input).netloc
                print(f"[AI_IMAGE_DOWNLOAD_HOST] host={url_host}")
                
                # Use requests with timeout and validation
                response = requests.get(image_input, timeout=30, allow_redirects=True)
                print(f"[AI_IMAGE_DOWNLOAD_RESPONSE] status={response.status_code} content_type={response.headers.get('Content-Type', 'unknown')}")
                
                if response.status_code != 200:
                    print(f"[AI_IMAGE_DOWNLOAD_ERROR] url={url_prefix}... error=invalid_status status={response.status_code}")
                    return None
                
                # Validate content type
                content_type = response.headers.get('Content-Type', '')
                if not content_type.startswith('image/'):
                    print(f"[AI_IMAGE_DOWNLOAD_ERROR] url={url_prefix}... error=invalid_content_type content_type={content_type}")
                    return None
                
                image_bytes = response.content
                print(f"[AI_IMAGE_DOWNLOAD_SUCCESS] byte_size={len(image_bytes)}")
                
                # Decode using cv2
                nparr = np.frombuffer(image_bytes, np.uint8)
                decoded = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if decoded is None:
                    print(f"[AI_IMAGE_DECODE_ERROR] error=cv2_decode_failed")
                    return None
                
                # Verify image dimensions
                height, width = decoded.shape[:2]
                channels = decoded.shape[2] if len(decoded.shape) == 3 else 1
                print(f"[AI_IMAGE_DECODE_SUCCESS] width={width} height={height} channels={channels}")
                
                if width <= 0 or height <= 0:
                    print(f"[AI_IMAGE_DECODE_ERROR] error=invalid_dimensions width={width} height={height}")
                    return None
                
                # Convert grayscale to RGB if needed
                if channels == 1:
                    print(f"[AI_IMAGE_CONVERT] from=grayscale to=RGB")
                    decoded = cv2.cvtColor(decoded, cv2.COLOR_GRAY2RGB)
                elif channels == 4:
                    print(f"[AI_IMAGE_CONVERT] from=RGBA to=RGB")
                    decoded = cv2.cvtColor(decoded, cv2.COLOR_RGBA2RGB)
                
                return decoded
            except Exception as exc:
                print(f"[AI_IMAGE_DOWNLOAD_ERROR] url={url_prefix}... error_type={type(exc).__name__} error={str(exc)}")
                return None
        else:
            print(f"[AI_IMAGE_DOWNLOAD_START] source=local_path path={image_input}")
            try:
                from pathlib import Path
                image_bytes = Path(image_input).read_bytes()
                print(f"[AI_IMAGE_DOWNLOAD_SUCCESS] byte_size={len(image_bytes)}")
                nparr = np.frombuffer(image_bytes, np.uint8)
                decoded = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if decoded is None:
                    print(f"[AI_IMAGE_DECODE_ERROR] error=cv2_decode_failed")
                    return None
                
                # Verify image dimensions
                height, width = decoded.shape[:2]
                channels = decoded.shape[2] if len(decoded.shape) == 3 else 1
                print(f"[AI_IMAGE_DECODE_SUCCESS] width={width} height={height} channels={channels}")
                
                if width <= 0 or height <= 0:
                    print(f"[AI_IMAGE_DECODE_ERROR] error=invalid_dimensions width={width} height={height}")
                    return None
                
                # Convert grayscale to RGB if needed
                if channels == 1:
                    print(f"[AI_IMAGE_CONVERT] from=grayscale to=RGB")
                    decoded = cv2.cvtColor(decoded, cv2.COLOR_GRAY2RGB)
                elif channels == 4:
                    print(f"[AI_IMAGE_CONVERT] from=RGBA to=RGB")
                    decoded = cv2.cvtColor(decoded, cv2.COLOR_RGBA2RGB)
                
                return decoded
            except Exception as exc:
                print(f"[AI_IMAGE_DOWNLOAD_ERROR] path={image_input} error_type={type(exc).__name__} error={str(exc)}")
                return None
    return None


def assess_image_quality(image_input: str | np.ndarray) -> dict[str, Any]:
    """Assess whether an image is suitable for embedding generation.

    The goal is to keep reports flow intact while providing a quality signal
    for admins and downstream matching. The function never rejects a report;
    it only returns the quality assessment and a score.
    """
    try:
        from PIL import Image
        import cv2
        import numpy as np
    except Exception as exc:
        return {
            "status": "unknown",
            "face_quality_score": 0.5,
            "reasons": [f"quality-check-unavailable: {exc}"],
        }

    try:
        image = load_image_from_url_or_path(image_input)

        if image is None:
            return {
                "status": "low_quality",
                "face_quality_score": 0.0,
                "reasons": ["image-unreadable"],
            }

        # Log image dimensions
        frame_height, frame_width = image.shape[:2]
        print(f"[QUALITY] Image dimensions: {frame_width}x{frame_height}")
        print(f"[QUALITY] Image shape: {image.shape}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces with Haar Cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
        
        print(f"[QUALITY] Raw faces detected: {len(faces)}")
        for i, (x, y, w, h) in enumerate(faces):
            print(f"[QUALITY]   Face {i+1}: x={x}, y={y}, w={w}, h={h}")

        # Filter out tiny false-positive faces
        # Use absolute minimum (80x80) and relative size (5% of image area)
        image_area = frame_height * frame_width
        min_face_area = 80 * 80  # Absolute minimum: 80x80 pixels
        min_relative_area = image_area * 0.05  # Relative minimum: 5% of image area
        
        valid_faces = []
        for x, y, w, h in faces:
            face_area = w * h
            passes_absolute = face_area >= min_face_area
            passes_relative = face_area >= min_relative_area
            
            print(f"[QUALITY]   Face check: x={x}, y={y}, w={w}, h={h}, area={face_area}")
            print(f"[QUALITY]     Absolute (>= {min_face_area}): {passes_absolute}")
            print(f"[QUALITY]     Relative (>= {int(min_relative_area)}): {passes_relative}")
            
            if passes_absolute and passes_relative:
                valid_faces.append((x, y, w, h))
                print(f"[QUALITY]   Valid face: x={x}, y={y}, w={w}, h={h}, area={face_area}")
            else:
                print(f"[QUALITY]   Filtered face: x={x}, y={y}, w={w}, h={h}, area={face_area}")

        print(f"[QUALITY] Valid faces after filtering: {len(valid_faces)}")

        # PHASE 4: Camera Quality Diagnostics
        print(f"[CAMERA_QUALITY]")
        print(f"faces_detected={len(faces)}")
        print(f"valid_faces={len(valid_faces)}")
        print(f"face_boxes={[(x, y, w, h) for x, y, w, h in faces]}")

        reasons: list[str] = []
        face_crop_result = None
        
        # Check face count
        if len(valid_faces) == 0:
            reasons.append("no-face")
        elif len(valid_faces) > 1:
            reasons.append("multiple-faces")
        else:
            # Exactly one valid face - use it for quality assessment
            x, y, w, h = valid_faces[0]
            
            print(f"[CAMERA_QUALITY]")
            print(f"largest_face_width={w}")
            print(f"largest_face_height={h}")
            
            # Check if face is partially hidden (near edges)
            if x <= 10 or y <= 10 or x + w >= frame_width - 10 or y + h >= frame_height - 10:
                reasons.append("partially-hidden-face")
            
            # Crop to the face for blur assessment AND embedding generation
            face_crop = image[y:y+h, x:x+w]
            if face_crop.size == 0:
                reasons.append("face-crop-failed")
            else:
                # Store the crop for embedding generation (even if there are soft warnings)
                face_crop_result = face_crop
                print(f"[CAMERA_QUALITY]")
                print(f"face_crop_width={w}")
                print(f"face_crop_height={h}")
                
                # Calculate Laplacian variance on the face crop only
                face_gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
                variance_of_laplacian = cv2.Laplacian(face_gray, cv2.CV_64F).var()
                blurry = variance_of_laplacian < 100.0
                
                print(f"[QUALITY] Face crop dimensions: {w}x{h}")
                print(f"[QUALITY] Face Laplacian variance: {variance_of_laplacian}")
                print(f"[QUALITY] Blur threshold: 100.0")
                print(f"[QUALITY] Is blurry: {blurry}")
                
                print(f"[CAMERA_QUALITY]")
                print(f"laplacian_variance={variance_of_laplacian}")
                print(f"blur_threshold=100.0")
                print(f"quality_score={1.0 - (0.25 * len(reasons)) if reasons else 1.0}")
                print(f"quality_reasons={reasons}")
                
                if blurry:
                    reasons.append("blurry-image")

        print(f"[QUALITY] Quality reasons: {reasons}")

        if reasons:
            score = max(0.0, 1.0 - (0.25 * len(reasons)))
            print(f"[QUALITY] Final score: {score}, status: low_quality")
            return {
                "status": "low_quality",
                "face_quality_score": round(score, 2),
                "reasons": reasons,
                "face_crop": face_crop_result,
            }

        print(f"[QUALITY] Final score: 1.0, status: good")
        return {
            "status": "good",
            "face_quality_score": 1.0,
            "reasons": [],
            "face_crop": face_crop_result,
        }
    except Exception as exc:
        print(f"[QUALITY] Exception: {exc}")
        return {
            "status": "unknown",
            "face_quality_score": 0.5,
            "reasons": [f"quality-check-error: {exc}"],
            "face_crop": None,
        }


def _normalize_embedding(value: Any) -> list[float] | None:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except (TypeError, ValueError):
            return None
        return parsed if isinstance(parsed, list) else None
    if isinstance(value, list):
        return value
    return None


def _parse_object_id(value: Any) -> ObjectId | None:
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str):
        try:
            return ObjectId(value)
        except Exception:
            return None
    return None


async def generate_embedding_for_image(image_input: str | np.ndarray, use_pre_cropped_face: bool = False) -> list[float] | None:
    """Generate a face embedding for an image using the existing DeepFace implementation."""
    print(f"[AI_EMBEDDING_GENERATE] starting use_pre_cropped_face={use_pre_cropped_face}")
    
    # Run blocking DeepFace operations in a thread to avoid blocking the event loop
    raw_embedding = await asyncio.to_thread(get_face_encoding, image_input, use_pre_cropped_face)
    
    if raw_embedding is None:
        print(f"[AI_EMBEDDING_ERROR] face_encoding_returned_none")
        log_event("Embedding Generated", status="failed")
        return None
    normalized = _normalize_embedding(raw_embedding)
    if normalized is None:
        print(f"[AI_EMBEDDING_ERROR] normalization_failed")
        log_event("Embedding Generated", status="failed")
        return None
    print(f"[AI_EMBEDDING_SUCCESS] embedding_dimensions={len(normalized)}")
    log_event("Embedding Generated", status="success", dimensions=len(normalized))
    return normalized


async def process_report_ai_pipeline(
    report_id: str,
    report_type: str,
    user_id: str | None,
    report_collection_name: str | None = None,
) -> None:
    """Background task: Generate embedding and run matching for a report.
    
    This function is designed to run in the background after the report
    has been successfully created and the HTTP response has been returned.
    It fetches the report from MongoDB, downloads the image from Cloudinary,
    and updates the report document with processing status and results.
    """
    from app.services.matching_service import run_matching_for_report
    
    db = get_db()
    report_obj_id = _parse_object_id(report_id)
    if report_collection_name is None:
        report_collection_name = "children" if report_type == "missing" else "children_found"

    print(f"[AI_JOB_START] child_id={report_id} report_type={report_type}")
    
    # Update status to processing
    await db[report_collection_name].update_one(
        {"_id": report_obj_id},
        {"$set": {"ai_processing_status": "processing", "embedding_status": "processing"}}
    )
    
    try:
        # Fetch report from MongoDB to get image_url
        print(f"[AI_REPORT_FETCH_START] child_id={report_id}")
        report = await db[report_collection_name].find_one({"_id": report_obj_id})
        if not report:
            print(f"[AI_REPORT_FETCH_ERROR] child_id={report_id} error=report_not_found")
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {"$set": {"ai_processing_status": "failed", "embedding_status": "failed", "ai_processing_error": "Report not found"}}
            )
            return
        print(f"[AI_REPORT_FETCH_SUCCESS] child_id={report_id}")
        
        # Get image_url from report
        image_url = report.get("image_url")
        if not image_url:
            print(f"[AI_REPORT_IMAGE_URL_ERROR] child_id={report_id} error=image_url_missing")
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {"$set": {"ai_processing_status": "failed", "embedding_status": "failed", "ai_processing_error": "Image URL missing"}}
            )
            return
        # Truncate URL to avoid logging sensitive signed URLs
        url_prefix = image_url[:80] if len(image_url) > 80 else image_url
        print(f"[AI_REPORT_IMAGE_URL_FOUND] child_id={report_id} url={url_prefix}...")
        
        # Load image from Cloudinary URL with retry mechanism
        print(f"[AI_IMAGE_LOAD_START] child_id={report_id}")
        print(f"[AI_IMAGE_SOURCE_TYPE] source_type=url")
        
        # Retry mechanism for image download (3 attempts)
        max_retries = 3
        image = None
        last_error = None
        
        for attempt in range(1, max_retries + 1):
            print(f"[AI_IMAGE_DOWNLOAD_ATTEMPT] attempt={attempt}/{max_retries}")
            image = load_image_from_url_or_path(image_url)
            if image is not None:
                print(f"[AI_IMAGE_DOWNLOAD_SUCCESS] attempt={attempt}")
                break
            last_error = "Image load returned None"
            if attempt < max_retries:
                import asyncio
                print(f"[AI_IMAGE_DOWNLOAD_RETRY] waiting_2s before_attempt={attempt + 1}")
                await asyncio.sleep(2)
        
        if image is None:
            print(f"[AI_IMAGE_LOAD_ERROR] child_id={report_id} source_type=url error={last_error} after_{max_retries}_attempts")
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {"$set": {"ai_processing_status": "failed", "embedding_status": "failed", "ai_processing_error": last_error}}
            )
            return
        print(f"[AI_IMAGE_LOAD_SUCCESS] child_id={report_id} image_shape={image.shape}")
        
        # Generate embedding
        print(f"[AI_EMBEDDING_START] child_id={report_id}")
        embedding_result = await create_embedding_record_for_report(
            report_id=report_id,
            report_type=report_type,
            user_id=user_id,
            image_input=image,
            report_collection_name=report_collection_name,
        )
        
        if embedding_result["status"] == "failed":
            print(f"[AI_JOB_ERROR] child_id={report_id} error=Embedding generation failed")
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {"$set": {"ai_processing_status": "failed", "embedding_status": "failed"}}
            )
            return
        
        print(f"[AI_MATCHING_START] child_id={report_id}")
        # Run matching
        candidate_collection_name = "children_found" if report_type == "missing" else "children"
        await run_matching_for_report(
            report_id=report_id,
            report_type=report_type,
            report_collection_name=report_collection_name,
            candidate_collection_name=candidate_collection_name,
        )
        
        print(f"[AI_MATCHING_COMPLETE] child_id={report_id}")
        # Update status to completed
        await db[report_collection_name].update_one(
            {"_id": report_obj_id},
            {"$set": {"ai_processing_status": "completed"}}
        )
        print(f"[AI_JOB_COMPLETE] child_id={report_id}")
        
    except Exception as e:
        print(f"[AI_JOB_ERROR] child_id={report_id} error={str(e)}")
        import traceback
        print(f"[AI_JOB_ERROR] child_id={report_id} traceback={traceback.format_exc()}")
        await db[report_collection_name].update_one(
            {"_id": report_obj_id},
            {"$set": {"ai_processing_status": "failed", "ai_processing_error": str(e)}}
        )


async def create_embedding_record_for_report(
    report_id: str,
    report_type: str,
    user_id: str | None,
    image_input: str | bytes | np.ndarray,
    report_collection_name: str | None = None,
    report_update_field: str = "embedding_id",
) -> dict[str, Any]:
    """Create a face embedding record and attach it to the report document."""
    db = get_db()
    report_obj_id = _parse_object_id(report_id)
    if report_collection_name is None:
        report_collection_name = "children" if report_type == "missing" else "children_found"

    print(f"[EMBEDDING] Processing report {report_id} ({report_type})")
    print(f"[EMBEDDING] Image input type: {type(image_input)}")
    
    if isinstance(image_input, bytes):
        print(f"[EMBEDDING] Image input size: {len(image_input)} bytes")
        import cv2
        nparr = np.frombuffer(image_input, np.uint8)
        image_input = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image_input is not None:
            print(f"[EMBEDDING] Decoded image shape: {image_input.shape}")
        else:
            print(f"[EMBEDDING] Failed to decode image from bytes")
    elif isinstance(image_input, np.ndarray):
        print(f"[EMBEDDING] Image input shape: {image_input.shape}")
    elif isinstance(image_input, str):
        print(f"[EMBEDDING] Image input URL/path: {image_input[:100]}...")

    quality = assess_image_quality(image_input)
    now = get_timestamp()
    reasons = quality.get("reasons", [])

    # PHASE: Quality decision diagnostics
    print(f"[EMBEDDING_QUALITY_DECISION]")
    print(f"quality_status={quality.get('status')}")
    print(f"quality_reasons={reasons}")

    # Define hard failures that prevent embedding generation
    hard_failure_reasons = {"no-face", "multiple-faces", "image-unreadable", "face-crop-failed"}
    
    # Define soft warnings that allow embedding generation
    soft_warning_reasons = {"blurry-image", "partially-hidden-face"}

    # Check if any hard failure reasons are present
    has_hard_failure = any(reason in hard_failure_reasons for reason in reasons)
    
    # Check if only soft warnings are present
    has_only_soft_warnings = all(reason in soft_warning_reasons for reason in reasons) and len(reasons) > 0

    print(f"[EMBEDDING_QUALITY_DECISION]")
    print(f"hard_failure={has_hard_failure}")
    print(f"soft_warning={has_only_soft_warnings}")

    # PHASE: Log before early-return condition
    print(f"[EMBEDDING_EARLY_RETURN_CHECK]")
    print(f"condition_check=quality.get('status') != 'good' and has_hard_failure")
    print(f"quality_status={quality.get('status')}")
    print(f"has_hard_failure={has_hard_failure}")
    print(f"will_early_return={quality.get('status') != 'good' and has_hard_failure}")

    if quality.get("status") != "good" and has_hard_failure:
        # Hard failure: do not generate embedding
        print(f"[EMBEDDING_EARLY_RETURN]")
        print(f"reason=hard_failure")
        print(f"quality_status={quality.get('status')}")
        print(f"reasons={reasons}")
        log_event(
            "Rejected Reason",
            report_id=report_id,
            report_type=report_type,
            reason="quality_hard_failure",
            quality_status=quality.get("status"),
            quality_reasons=reasons,
        )
        embedding_doc = {
            "report_id": report_obj_id,
            "report_type": report_type,
            "user_id": user_id,
            "embedding": [],
            "model_name": FACE_MODEL_NAME,
            "model_version": "1.0",
            "embedding_model_version": "onnx_arcface_v1",
            "embedding_dimensions": 0,
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "status": "failed",
            "quality_reasons": reasons,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.face_embeddings.insert_one(embedding_doc)
        if report_obj_id is not None:
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {
                    "$set": {
                        report_update_field: str(result.inserted_id),
                        "embedding_status": "failed",
                        "embedding_model": FACE_MODEL_NAME,
                        "face_quality_score": quality.get("face_quality_score", 0.0),
                        "quality_reasons": reasons,
                        "updated_at": now,
                    }
                },
            )
        return {
            "embedding_id": str(result.inserted_id),
            "status": "failed",
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "embedding_dimensions": 0,
        }

    # PHASE: ArcFace input diagnostics
    print(f"[ARC_FACE_INPUT]")
    print(f"reached_arcface=true")
    
    # Use face crop from quality assessment if available (avoids duplicate detection)
    face_crop = quality.get("face_crop")
    if face_crop is not None:
        print(f"[AI_FACE_CROP_START] using_pre_cropped_face=true")
        print(f"[AI_FACE_CROP_SUCCESS] crop_shape={face_crop.shape}")
        embedding_input = face_crop
    else:
        print(f"[AI_FACE_CROP_START] using_pre_cropped_face=false")
        print(f"[AI_FACE_CROP_START] using_full_image=true")
        embedding_input = image_input
    
    if isinstance(embedding_input, np.ndarray):
        print(f"image_shape={embedding_input.shape}")
    else:
        print(f"image_type={type(embedding_input)}")

    embedding = await generate_embedding_for_image(embedding_input, use_pre_cropped_face=(face_crop is not None))
    
    # PHASE: ArcFace result diagnostics
    print(f"[ARC_FACE_RESULT]")
    if embedding is None:
        print(f"success=false")
        print(f"embedding_dimensions=0")
        print(f"error=embedding_generation_failed")
    else:
        print(f"success=true")
        print(f"embedding_dimensions={len(embedding)}")
        print(f"error=none")
    
    if embedding is None:
        log_event(
            "Rejected Reason",
            report_id=report_id,
            report_type=report_type,
            reason="embedding-generation-failed",
            quality_status=quality.get("status"),
            quality_reasons=quality.get("reasons", []),
        )
        embedding_doc = {
            "report_id": report_obj_id,
            "report_type": report_type,
            "user_id": user_id,
            "embedding": [],
            "model_name": FACE_MODEL_NAME,
            "model_version": "1.0",
            "embedding_model_version": "onnx_arcface_v1",
            "embedding_dimensions": 0,
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "status": "failed",
            "quality_reasons": quality.get("reasons", []),
            "created_at": now,
            "updated_at": now,
        }
        result = await db.face_embeddings.insert_one(embedding_doc)
        if report_obj_id is not None:
            await db[report_collection_name].update_one(
                {"_id": report_obj_id},
                {
                    "$set": {
                        report_update_field: str(result.inserted_id),
                        "embedding_status": "failed",
                        "embedding_model": FACE_MODEL_NAME,
                        "face_quality_score": quality.get("face_quality_score", 0.0),
                        "quality_reasons": quality.get("reasons", []),
                        "updated_at": now,
                    }
                },
            )
        return {
            "embedding_id": str(result.inserted_id),
            "status": "failed",
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "embedding_dimensions": 0,
        }

    # Determine final status based on quality warnings
    # If we have soft warnings but embedding succeeded, mark as success with warnings
    if has_only_soft_warnings:
        embedding_status = "success_with_warnings"
        doc_status = "success"
    else:
        embedding_status = "success"
        doc_status = "success"

    embedding_doc = {
        "report_id": report_obj_id,
        "report_type": report_type,
        "user_id": user_id,
        "embedding": embedding,
        "model_name": FACE_MODEL_NAME,
        "model_version": "1.0",
        "embedding_model_version": "onnx_arcface_v1",
        "embedding_dimensions": len(embedding),
        "face_quality_score": quality.get("face_quality_score", 1.0),
        "status": doc_status,
        "quality_reasons": reasons,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.face_embeddings.insert_one(embedding_doc)
    if report_obj_id is not None:
        await db[report_collection_name].update_one(
            {"_id": report_obj_id},
            {
                "$set": {
                    report_update_field: str(result.inserted_id),
                    "embedding_status": embedding_status,
                    "embedding_model": FACE_MODEL_NAME,
                    "face_quality_score": quality.get("face_quality_score", 1.0),
                    "quality_reasons": reasons,
                    "updated_at": now,
                }
            },
        )

    log_event(
        "Embedding Generated",
        report_id=report_id,
        report_type=report_type,
        status="success",
        dimensions=len(embedding),
        quality_score=quality.get("face_quality_score", 1.0),
    )

    return {
        "embedding_id": str(result.inserted_id),
        "status": "success",
        "face_quality_score": quality.get("face_quality_score", 1.0),
        "embedding_dimensions": len(embedding),
    }
