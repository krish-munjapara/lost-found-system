"""
Migration script: Add structured location support.
Migrates existing free-text location to structured format.
"""

from app.database import get_db
from app.utils import get_timestamp
import re


async def parse_legacy_location(location_str: str) -> dict:
    """
    Parse legacy location string to extract structured data.
    
    Examples:
    - "Lat: 22.2897, Lon: 73.3641" → {latitude: 22.2897, longitude: 73.3641}
    - "Mumbai, Maharashtra" → {city: "Mumbai", state: "Maharashtra"}
    - "Delhi" → {city: "Delhi", state: "Delhi"}
    """
    result = {
        "country": "India",
        "state": None,
        "district": None,
        "city": None,
        "address": None,
        "pincode": None,
        "latitude": None,
        "longitude": None,
        "geo_point": None
    }
    
    if not location_str:
        return result
    
    # Try to extract coordinates
    coord_pattern = r"Lat:\s*([+-]?\d+\.?\d*),\s*Lon:\s*([+-]?\d+\.?\d*)"
    coord_match = re.search(coord_pattern, location_str, re.IGNORECASE)
    if coord_match:
        result["latitude"] = float(coord_match.group(1))
        result["longitude"] = float(coord_match.group(2))
        result["geo_point"] = {
            "type": "Point",
            "coordinates": [result["longitude"], result["latitude"]]
        }
    
    # Try to extract city/state from comma-separated values
    parts = [p.strip() for p in location_str.replace("Lat:", "").replace("Lon:", "").split(",")]
    if len(parts) >= 2:
        # Assume format: "City, State" or "City, District, State"
        if len(parts) == 2:
            result["city"] = parts[0]
            result["state"] = parts[1]
        elif len(parts) >= 3:
            result["city"] = parts[0]
            result["district"] = parts[1]
            result["state"] = parts[2]
    elif len(parts) == 1:
        # Single value - could be city or state
        result["city"] = parts[0]
        # Default state to same as city for major cities
        major_cities = {
            "Delhi": "Delhi",
            "Mumbai": "Maharashtra",
            "Bangalore": "Karnataka",
            "Chennai": "Tamil Nadu",
            "Kolkata": "West Bengal",
            "Hyderabad": "Telangana",
            "Pune": "Maharashtra",
            "Ahmedabad": "Gujarat",
        }
        if parts[0] in major_cities:
            result["state"] = major_cities[parts[0]]
    
    return result


async def migrate_children_collection():
    """Migrate children collection to structured location."""
    db = get_db()
    
    # Find all documents without location_structured
    cursor = db.children.find({"location_structured": {"$exists": False}})
    
    migrated_count = 0
    async for doc in cursor:
        legacy_location = doc.get("location", "")
        structured = await parse_legacy_location(legacy_location)
        
        # Update document
        await db.children.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "location_structured": structured,
                    "location_version": 2,
                    "updated_at": get_timestamp()
                }
            }
        )
        migrated_count += 1
    
    print(f"[MIGRATION] Migrated {migrated_count} documents in children collection")
    return migrated_count


async def migrate_children_found_collection():
    """Migrate children_found collection to structured location."""
    db = get_db()
    
    cursor = db.children_found.find({"location_structured": {"$exists": False}})
    
    migrated_count = 0
    async for doc in cursor:
        legacy_location = doc.get("location", "")
        structured = await parse_legacy_location(legacy_location)
        
        await db.children_found.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "location_structured": structured,
                    "location_version": 2,
                    "updated_at": get_timestamp()
                }
            }
        )
        migrated_count += 1
    
    print(f"[MIGRATION] Migrated {migrated_count} documents in children_found collection")
    return migrated_count


async def run_migration():
    """Run the complete migration."""
    print("[MIGRATION] Starting location structure migration...")
    
    children_migrated = await migrate_children_collection()
    children_found_migrated = await migrate_children_found_collection()
    
    total = children_migrated + children_found_migrated
    print(f"[MIGRATION] Migration complete. Total documents migrated: {total}")
    
    return {
        "children": children_migrated,
        "children_found": children_found_migrated,
        "total": total
    }


if __name__ == "__main__":
    import asyncio
    from app.database import connect_db, close_db
    
    async def main():
        await connect_db()
        try:
            result = await run_migration()
            print(f"[MIGRATION] Result: {result}")
        finally:
            await close_db()
    
    asyncio.run(main())
