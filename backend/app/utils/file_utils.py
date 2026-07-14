"""File upload validation, compression, and safe storage."""

import io
import uuid

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.config import (
    ALLOWED_IMAGE_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_UPLOAD_SIZE_MB,
)


def _validate_content_type(content_type: str | None) -> str:
    if not content_type or content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: JPEG, PNG, WebP",
        )
    return content_type.lower()


async def read_and_validate_upload(photo: UploadFile) -> tuple[bytes, str]:
    """Read upload, validate MIME type and size."""
    content_type = _validate_content_type(photo.content_type)
    data = await photo.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    if len(data) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_MB}MB",
        )
    return data, content_type


def compress_image(data: bytes, max_dimension: int = 1280, quality: int = 85) -> bytes:
    """Resize and compress image for storage."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=quality, optimize=True)
        return out.getvalue()
    except Exception:
        return data


def generate_filename(content_type: str) -> str:
    ext = ".jpg" if "jpeg" in content_type or "jpg" in content_type else ".png"
    if "webp" in content_type:
        ext = ".webp"
    return f"{uuid.uuid4().hex}{ext}"



