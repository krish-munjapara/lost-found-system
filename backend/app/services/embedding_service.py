"""Face embedding persistence service for Guardian-Link."""

from __future__ import annotations

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
        return image_input

    if isinstance(image_input, str):
        import cv2
        if image_input.startswith("http://") or image_input.startswith("https://"):
            try:
                import urllib.request
                with urllib.request.urlopen(image_input) as response:
                    image_bytes = response.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as exc:
                print(f"Error downloading image from URL {image_input}: {exc}")
                return None
        else:
            try:
                from pathlib import Path
                image_bytes = Path(image_input).read_bytes()
                nparr = np.frombuffer(image_bytes, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as exc:
                print(f"Error reading local file {image_input}: {exc}")
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

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        variance_of_laplacian = cv2.Laplacian(gray, cv2.CV_64F).var()
        blurry = variance_of_laplacian < 100.0

        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

        reasons: list[str] = []
        if blurry:
            reasons.append("blurry-image")
        if len(faces) == 0:
            reasons.append("no-face")
        elif len(faces) > 1:
            reasons.append("multiple-faces")
        else:
            x, y, w, h = faces[0]
            frame_height, frame_width = image.shape[:2]
            face_area = w * h
            image_area = frame_height * frame_width
            if w < 60 or h < 60:
                reasons.append("tiny-face")
            if x <= 10 or y <= 10 or x + w >= frame_width - 10 or y + h >= frame_height - 10:
                reasons.append("partially-hidden-face")

        if reasons:
            score = max(0.0, 1.0 - (0.25 * len(reasons)))
            return {
                "status": "low_quality",
                "face_quality_score": round(score, 2),
                "reasons": reasons,
            }

        return {
            "status": "good",
            "face_quality_score": 1.0,
            "reasons": [],
        }
    except Exception as exc:
        return {
            "status": "unknown",
            "face_quality_score": 0.5,
            "reasons": [f"quality-check-error: {exc}"],
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


async def generate_embedding_for_image(image_input: str | np.ndarray) -> list[float] | None:
    """Generate a face embedding for an image using the existing DeepFace implementation."""
    raw_embedding = get_face_encoding(image_input)
    normalized = _normalize_embedding(raw_embedding)
    if normalized is None:
        log_event("Embedding Generated", status="failed")
    else:
        log_event("Embedding Generated", status="success", dimensions=len(normalized))
    return normalized


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

    if isinstance(image_input, bytes):
        import cv2
        nparr = np.frombuffer(image_input, np.uint8)
        image_input = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    quality = assess_image_quality(image_input)
    now = get_timestamp()

    if quality.get("status") != "good":
        log_event(
            "Rejected Reason",
            report_id=report_id,
            report_type=report_type,
            reason="quality",
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
            "embedding_dimensions": 0,
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "status": "low_quality",
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
                        "embedding_status": "low_quality",
                        "embedding_model": FACE_MODEL_NAME,
                        "face_quality_score": quality.get("face_quality_score", 0.0),
                        "quality_reasons": quality.get("reasons", []),
                        "updated_at": now,
                    }
                },
            )
        return {
            "embedding_id": str(result.inserted_id),
            "status": "low_quality",
            "face_quality_score": quality.get("face_quality_score", 0.0),
            "embedding_dimensions": 0,
        }

    embedding = await generate_embedding_for_image(image_input)
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

    embedding_doc = {
        "report_id": report_obj_id,
        "report_type": report_type,
        "user_id": user_id,
        "embedding": embedding,
        "model_name": FACE_MODEL_NAME,
        "model_version": "1.0",
        "embedding_dimensions": len(embedding),
        "face_quality_score": quality.get("face_quality_score", 1.0),
        "status": "success",
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
                    "embedding_status": "success",
                    "embedding_model": FACE_MODEL_NAME,
                    "face_quality_score": quality.get("face_quality_score", 1.0),
                    "quality_reasons": quality.get("reasons", []),
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
