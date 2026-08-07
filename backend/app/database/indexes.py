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

    # New indexes for structured location
    await db.children.create_index([("location_structured.state", 1)])
    await db.children.create_index([("location_structured.district", 1)])
    await db.children.create_index([("location_structured.city", 1)])
    await db.children.create_index([("location_structured.pincode", 1)])
    
    # Geo-spatial index for location queries
    await db.children.create_index([("location_structured.geo_point", "2dsphere")])
    
    # Same indexes for children_found
    await db.children_found.create_index([("location_structured.state", 1)])
    await db.children_found.create_index([("location_structured.district", 1)])
    await db.children_found.create_index([("location_structured.city", 1)])
    await db.children_found.create_index([("location_structured.pincode", 1)])
    await db.children_found.create_index([("location_structured.geo_point", "2dsphere")])
    
    # Index for location_version to support migration queries
    await db.children.create_index([("location_version", 1)])
    await db.children_found.create_index([("location_version", 1)])
    
    # Index for face_embeddings
    await db.face_embeddings.create_index([("report_id", 1)])
    await db.face_embeddings.create_index([("status", 1)])
    await db.face_embeddings.create_index([("embedding_dimensions", 1)])

    print("[INDEXES] MongoDB indexes ensured")
