"""Audit log helper."""

from app.database import get_db
from app.utils import get_timestamp


async def log_action(
    actor_email: str,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict | None = None,
) -> None:
    db = get_db()
    await db.audit_logs.insert_one({
        "actor_email": actor_email,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "created_at": get_timestamp(),
    })
