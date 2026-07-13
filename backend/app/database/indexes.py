"""MongoDB index definitions — created on application startup."""

from app.database import get_db


async def ensure_indexes() -> None:
    db = get_db()

    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")

    for col, fields in [
        ("children", [("reporter_email", 1), ("created_at", -1), ("status", 1)]),
        ("children_found", [("reporter_email", 1), ("created_at", -1)]),
        ("matches", [("status", 1), ("created_at", -1), ("missing_reporter", 1), ("found_reporter", 1)]),
        ("user_notifications", [("recipient_email", 1), ("read", 1), ("created_at", -1)]),
        ("notifications", [("created_at", -1)]),
        ("refresh_tokens", [("token_hash", 1), ("email", 1), ("expires_at", 1)]),
        ("password_reset_tokens", [("token_hash", 1), ("expires_at", 1)]),
        ("email_verification_tokens", [("token_hash", 1), ("expires_at", 1)]),
        ("audit_logs", [("created_at", -1), ("actor_email", 1), ("action", 1)]),
    ]:
        collection = db[col]
        for field, direction in fields:
            await collection.create_index([(field, direction)])

    print("✅ MongoDB indexes ensured")
