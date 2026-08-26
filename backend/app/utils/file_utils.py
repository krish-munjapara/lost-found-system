"""File upload validation, compression, and safe storage."""

import io
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.config import (
    ALLOWED_IMAGE_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_UPLOAD_SIZE_MB,
)

# PHASE 5: Debug directory for camera images
DEBUG_DIR = Path(__file__).parent.parent.parent / "debug_camera_images"
DEBUG_DIR.mkdir(exist_ok=True)


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
    
    # PHASE 3: Backend Upload Diagnostics
    print(f"[UPLOAD_DIAGNOSTIC]")
    print(f"content_type={content_type}")
    print(f"byte_size={len(data)}")
    
    # Try to decode image to get dimensions
    try:
        img = Image.open(io.BytesIO(data))
        print(f"decoded_width={img.width}")
        print(f"decoded_height={img.height}")
        print(f"channels={len(img.getbands()) if img.getbands() else 'N/A'}")
        print(f"image_format={img.format}")
        
        # PHASE 5: Save debug copy of camera image
        debug_filename = f"debug_{uuid.uuid4().hex}.jpg"
        debug_path = DEBUG_DIR / debug_filename
        with open(debug_path, 'wb') as f:
            f.write(data)
        print(f"[UPLOAD_DIAGNOSTIC] debug_saved={debug_path}")
    except Exception as e:
        print(f"image_decode_error={e}")
    
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



