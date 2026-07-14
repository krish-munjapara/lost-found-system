"""
Guardian-Link Database Module
MongoDB connection using Motor (async driver).
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, DATABASE_NAME

# ──────────────────────────────────────────────
# MongoDB Connection
# ──────────────────────────────────────────────
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Initialize MongoDB connection."""
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    print(f"Connected to MongoDB: {DATABASE_NAME}")
    return db


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    """Get the database instance."""
    return db
