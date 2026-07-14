"""Image storage — Cloudinary only."""

from fastapi import HTTPException, status
from app.config import (
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_ENABLED,
)


def upload_image(data: bytes, folder: str, filename: str) -> dict:
    """
    Upload image to Cloudinary.
    Raises exception if Cloudinary is not configured or upload fails.
    """
    if not CLOUDINARY_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary is not configured. Image uploads are disabled."
        )
        
    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
        )
        result = cloudinary.uploader.upload(
            data,
            folder=f"guardian-link/{folder}",
            public_id=filename.rsplit(".", 1)[0],
            overwrite=True,
            resource_type="image",
        )
        return {
            "image_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "storage": "cloudinary",
        }
    except Exception as exc:
        print(f"⚠️ Cloudinary upload failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(exc)}"
        )

