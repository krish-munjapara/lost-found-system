"""
Guardian-Link Utility Helpers
Common helper functions used across the application.
"""

from bson import ObjectId
from datetime import datetime


def serialize_doc(doc: dict) -> dict:
    """
    Convert MongoDB document to JSON-serializable format.
    Converts ObjectId to string and datetime to ISO format.
    """
    if doc is None:
        return None

    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized["id" if key == "_id" else key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        elif isinstance(value, list):
            serialized[key] = [
                serialize_doc(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            serialized[key] = value

    # Remove  _id if it was converted to id
    serialized.pop("_id", None)
    return serialized


def validate_object_id(id_str: str) -> ObjectId | None:
    """
    Validate and convert a string to ObjectId.
    Returns None if the string is not a valid ObjectId.
    """
    try:
        return ObjectId(id_str)
    except Exception:
        return None


def get_timestamp() -> datetime:
    """Get current UTC timestamp."""
    return datetime.utcnow()
