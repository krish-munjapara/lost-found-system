"""Image storage — Cloudinary with local fallback."""

from app.config import (
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_ENABLED,
)
from app.utils.file_utils import save_image_locally


def upload_image(data: bytes, folder: str, filename: str) -> dict:
    """
    Upload image to Cloudinary if configured, else save locally.
    Returns dict with filename, url, storage backend.
    """
    if CLOUDINARY_ENABLED:
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
                "filename": filename,
                "image_url": result.get("secure_url"),
                "storage": "cloudinary",
            }
        except Exception as exc:
            print(f"⚠️ Cloudinary upload failed, using local storage: {exc}")

    save_image_locally(data, folder, filename)
    return {
        "filename": filename,
        "image_url": f"/uploads/{folder}/{filename}",
        "storage": "local",
    }


def resolve_image_url(filename: str, folder: str, image_url: str | None = None) -> str:
    if image_url and image_url.startswith("http"):
        return image_url
    return f"/uploads/{folder}/{filename}"
