"""
Guardian-Link Public Routes  (NO AUTH REQUIRED)
─────────────────────────────────────────────────
Public-facing endpoints accessible to all visitors.
Used for the public feed page showing missing children
and for sharing individual reports.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from bson import ObjectId
from datetime import datetime

from app.database import get_db
from app.utils import serialize_doc

router = APIRouter(prefix="/api/public", tags=["Public Feed"])


# ──────────────────────────────────────────────
# DEMO DATA FOR INTELLIGENCE MAP
# Fallback data when MongoDB doesn't have real state-wise data
# ──────────────────────────────────────────────
def get_demo_map_data():
    """
    Returns realistic demo data for the intelligence map.
    Used as fallback when MongoDB doesn't contain proper state-wise information.
    """
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    
    demo_states = [
        {
            "id": "GJ",
            "name": "Gujarat",
            "missing": 1247,
            "found": 892,
            "resolved": 654,
            "pending": 523,
            "ai_matches": 312,
            "heat_score": 0.68,
            "heat_level": "orange",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Ahmedabad", "missing": 342, "found": 234},
                {"name": "Surat", "missing": 287, "found": 198}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Gujarat State Commission for Women", "Gujarat Police"]
        },
        {
            "id": "MH",
            "name": "Maharashtra",
            "missing": 2156,
            "found": 1456,
            "resolved": 987,
            "pending": 892,
            "ai_matches": 543,
            "heat_score": 0.78,
            "heat_level": "red",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Mumbai", "missing": 678, "found": 456},
                {"name": "Pune", "missing": 432, "found": 321}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Maharashtra State Commission for Women", "Maharashtra Police"]
        },
        {
            "id": "RJ",
            "name": "Rajasthan",
            "missing": 1876,
            "found": 1234,
            "resolved": 876,
            "pending": 678,
            "ai_matches": 421,
            "heat_score": 0.72,
            "heat_level": "orange",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Jaipur", "missing": 456, "found": 312},
                {"name": "Jodhpur", "missing": 234, "found": 178}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Rajasthan State Commission for Women", "Rajasthan Police"]
        },
        {
            "id": "DL",
            "name": "Delhi",
            "missing": 3421,
            "found": 2345,
            "resolved": 1567,
            "pending": 1234,
            "ai_matches": 876,
            "heat_score": 0.85,
            "heat_level": "red",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "New Delhi", "missing": 1234, "found": 876},
                {"name": "North Delhi", "missing": 567, "found": 432}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Delhi Commission for Women", "Delhi Police"]
        },
        {
            "id": "KA",
            "name": "Karnataka",
            "missing": 1654,
            "found": 1123,
            "resolved": 876,
            "pending": 543,
            "ai_matches": 398,
            "heat_score": 0.65,
            "heat_level": "orange",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Bengaluru", "missing": 567, "found": 432},
                {"name": "Mysore", "missing": 234, "found": 178}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Karnataka State Commission for Women", "Karnataka Police"]
        },
        {
            "id": "TN",
            "name": "Tamil Nadu",
            "missing": 1432,
            "found": 987,
            "resolved": 765,
            "pending": 456,
            "ai_matches": 345,
            "heat_score": 0.58,
            "heat_level": "yellow",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Chennai", "missing": 456, "found": 321},
                {"name": "Coimbatore", "missing": 234, "found": 178}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Tamil Nadu State Commission for Women", "Tamil Nadu Police"]
        },
        {
            "id": "UP",
            "name": "Uttar Pradesh",
            "missing": 2876,
            "found": 1987,
            "resolved": 1234,
            "pending": 1123,
            "ai_matches": 654,
            "heat_score": 0.82,
            "heat_level": "red",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Lucknow", "missing": 567, "found": 432},
                {"name": "Kanpur", "missing": 432, "found": 321}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Uttar Pradesh State Commission for Women", "Uttar Pradesh Police"]
        },
        {
            "id": "MP",
            "name": "Madhya Pradesh",
            "missing": 1234,
            "found": 876,
            "resolved": 654,
            "pending": 432,
            "ai_matches": 287,
            "heat_score": 0.52,
            "heat_level": "yellow",
            "last_updated": now.isoformat(),
            "top_cities": [
                {"name": "Bhopal", "missing": 345, "found": 234},
                {"name": "Indore", "missing": 287, "found": 198}
            ],
            "emergency_numbers": ["100", "1098", "112"],
            "government_contacts": ["Madhya Pradesh State Commission for Women", "Madhya Pradesh Police"]
        }
    ]
    
    # Calculate national statistics from demo data
    total_missing = sum(s["missing"] for s in demo_states)
    total_found = sum(s["found"] for s in demo_states)
    total_resolved = sum(s["resolved"] for s in demo_states)
    total_pending = sum(s["pending"] for s in demo_states)
    total_ai_matches = sum(s["ai_matches"] for s in demo_states)
    avg_heat_score = sum(s["heat_score"] for s in demo_states) / len(demo_states)
    
    return {
        "states": demo_states,
        "national_stats": {
            "total_missing": total_missing,
            "total_found": total_found,
            "total_resolved": total_resolved,
            "total_pending": total_pending,
            "total_ai_matches": total_ai_matches,
            "avg_heat_score": round(avg_heat_score, 2)
        },
        "last_updated": now.isoformat()
    }


# ──────────────────────────────────────────────
# GET /api/public/feed — Public Missing Children Feed
# No authentication required. Shows all missing children.
# ──────────────────────────────────────────────
@router.get("/feed")
async def get_public_feed(
    search: Optional[str] = Query(None, description="Search by name or location"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Public feed of all missing children reports.
    Accessible without login. Returns paginated results.
    """
    db = get_db()

    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]

    total = await db.children.count_documents(query)
    skip = (page - 1) * limit

    cursor = db.children.find(
        query,
        # Exclude sensitive fields like encoding, reporter_email
        {"encoding": 0, "reporter_email": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)

    children = [serialize_doc(doc) async for doc in cursor]

    return {
        "children": children,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


# ──────────────────────────────────────────────
# GET /api/public/child/{child_id} — Single child detail
# No authentication required.
# ──────────────────────────────────────────────
@router.get("/child/{child_id}")
async def get_public_child(child_id: str):
    """
    Get a single missing child report for sharing/viewing.
    No authentication required.
    """
    db = get_db()

    try:
        oid = ObjectId(child_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid child ID format"
        )

    doc = await db.children.find_one(
        {"_id": oid},
        {"encoding": 0, "reporter_email": 0}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child report not found"
        )

    return serialize_doc(doc)


# ──────────────────────────────────────────────
# GET /api/public/stats — Public statistics
# No authentication required.
# ──────────────────────────────────────────────
@router.get("/stats")
async def get_public_stats():
    """
    Public statistics for the landing/feed page.
    Shows aggregate counts without any sensitive data.
    """
    db = get_db()

    missing_count = await db.children.count_documents({})
    found_count = await db.children_found.count_documents({})
    match_count = await db.children.count_documents({"status": "Ai Matches"})
    resolved_count = await db.children.count_documents({"status": "Resolved"})

    return {
        "missing_count": missing_count,
        "found_count": found_count,
        "match_count": match_count,
        "resolved_count": resolved_count,
    }


# ──────────────────────────────────────────────
# GET /api/public/recent-alerts — Latest 5 missing reports
# Used for the notification ticker / alerts banner
# ──────────────────────────────────────────────
@router.get("/recent-alerts")
async def get_recent_alerts():
    """
    Get the 5 most recent missing child reports for alert banners.
    No authentication required.
    """
    db = get_db()

    cursor = db.children.find(
        {},
        {"encoding": 0, "reporter_email": 0}
    ).sort("created_at", -1).limit(5)

    alerts = [serialize_doc(doc) async for doc in cursor]
    return alerts


# ──────────────────────────────────────────────
# GET /api/public/news — Latest child safety news
# No authentication required.
# Supports pagination, category filtering, and search.
# ──────────────────────────────────────────────
@router.get("/news")
async def get_news(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query('all'),
    search: Optional[str] = Query(None)
):
    """
    Get latest child safety news from RSS feeds with pagination.
    
    Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 20, max: 100)
    - category: Filter by category (default: 'all')
    - search: Search query string (optional)
    
    Returns relevant articles about missing children, child safety, etc.
    """
    try:
        from app.services.news import news_service
        
        result = await news_service.get_news(
            page=page,
            limit=limit,
            category=category,
            search_query=search
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch news: {str(e)}"
        )


# ──────────────────────────────────────────────
# GET /api/public/map — Child Safety Intelligence Map
# No authentication required.
# Returns state-wise child safety statistics for the intelligence map.
# ──────────────────────────────────────────────
@router.get("/map")
async def get_intelligence_map():
    """
    Get child safety intelligence map data with state-wise statistics.
    Calculates real statistics from MongoDB collections.
    Falls back to demo data if MongoDB doesn't have proper state-wise information.
    """
    try:
        db = get_db()
        
        # State code mapping for Indian states
        state_mapping = {
            'MH': 'Maharashtra', 'DL': 'Delhi', 'KA': 'Karnataka', 'TN': 'Tamil Nadu',
            'UP': 'Uttar Pradesh', 'GJ': 'Gujarat', 'RJ': 'Rajasthan', 'WB': 'West Bengal',
            'MP': 'Madhya Pradesh', 'AP': 'Andhra Pradesh', 'TS': 'Telangana', 'KL': 'Kerala',
            'PB': 'Punjab', 'HR': 'Haryana', 'BR': 'Bihar', 'OR': 'Odisha',
            'AS': 'Assam', 'JH': 'Jharkhand', 'CT': 'Chhattisgarh', 'UK': 'Uttarakhand',
            'HP': 'Himachal Pradesh', 'JK': 'Jammu & Kashmir', 'GA': 'Goa', 'MN': 'Manipur',
            'MZ': 'Mizoram', 'NL': 'Nagaland', 'TR': 'Tripura', 'ML': 'Meghalaya',
            'AR': 'Arunachal Pradesh', 'SK': 'Sikkim', 'AN': 'Andaman and Nicobar',
            'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli and Daman and Diu',
            'LD': 'Ladakh', 'PY': 'Puducherry'
        }
        
        # Aggregate state-wise statistics from children collection using structured location
        pipeline = [
            {
                "$match": {
                    "location_structured.state": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": "$location_structured.state",
                    "missing": {"$sum": 1},
                    "resolved": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]
                        }
                    },
                    "pending": {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "Pending"]}, 1, 0]
                        }
                    }
                }
            }
        ]
        
        state_stats = {}
        async for doc in db.children.aggregate(pipeline):
            state_name = doc["_id"]
            state_stats[state_name] = {
                "missing": doc["missing"],
                "found": 0,  # Will be updated from children_found
                "resolved": doc["resolved"],
                "pending": doc["pending"]
            }
        
        # Get found children by location using structured location
        found_pipeline = [
            {
                "$match": {
                    "location_structured.state": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": "$location_structured.state",
                    "found": {"$sum": 1}
                }
            }
        ]
        
        async for doc in db.children_found.aggregate(found_pipeline):
            state_name = doc["_id"]
            if state_name in state_stats:
                state_stats[state_name]["found"] = doc["found"]
            else:
                state_stats[state_name] = {
                    "missing": 0,
                    "found": doc["found"],
                    "resolved": 0,
                    "pending": 0
                }
        
        # Check if we have meaningful real data
        # If total missing across all states is very low (< 10), use demo data
        total_missing_real = sum(stats["missing"] for stats in state_stats.values())
        
        # Fallback to demo data if no real data exists
        if total_missing_real < 10:
            print("[MAP] Using demo data - insufficient real data in MongoDB")
            demo_data = get_demo_map_data()
            return {
                "success": True,
                "data": demo_data
            }
        
        # Get AI matches count
        ai_matches_count = await db.children.count_documents({"status": "Ai Matches"})
        
        # Build states array with real data
        states = []
        total_missing = 0
        total_found = 0
        total_resolved = 0
        total_pending = 0
        total_heat_score = 0
        
        for state_code, state_name in state_mapping.items():
            # Get state data directly from state_stats (now keyed by state name)
            state_data = state_stats.get(state_name)
            
            if state_data:
                missing = state_data["missing"]
                found = state_data["found"]
                resolved = state_data["resolved"]
                pending = state_data["pending"]
            else:
                # No data for this state
                missing = 0
                found = 0
                resolved = 0
                pending = 0
            
            # Calculate heat score based on real data
            total_cases = missing + found + resolved + pending
            if total_cases > 0:
                heat_score = (missing / total_cases) * 0.5 + (pending / total_cases) * 0.3
            else:
                heat_score = 0
            
            # Determine heat level
            if heat_score >= 0.7:
                heat_level = "red"
            elif heat_score >= 0.5:
                heat_level = "orange"
            elif heat_score >= 0.3:
                heat_level = "yellow"
            elif heat_score >= 0.1:
                heat_level = "green"
            else:
                heat_level = "gray"
            
            # Calculate AI matches proportionally
            ai_matches = int((missing / max(total_missing, 1)) * ai_matches_count) if missing > 0 else 0
            
            # Get top cities for this state (real data)
            top_cities = []
            city_pipeline = [
                {"$match": {"location_structured.state": state_name}},
                {"$group": {"_id": "$location_structured.city", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 3}
            ]
            
            async for doc in db.children.aggregate(city_pipeline):
                top_cities.append({
                    "name": doc["_id"],
                    "missing": doc["count"],
                    "found": 0  # Simplified for now
                })
            
            if not top_cities:
                top_cities = [{"name": "N/A", "missing": 0, "found": 0}]
            
            states.append({
                "id": state_code,
                "name": state_name,
                "missing": missing,
                "found": found,
                "resolved": resolved,
                "pending": pending,
                "ai_matches": ai_matches,
                "heat_score": round(heat_score, 2),
                "heat_level": heat_level,
                "last_updated": datetime.utcnow().isoformat(),
                "top_cities": top_cities[:2],
                "emergency_numbers": ["100", "1098", "112"],
                "government_contacts": ["State Commission for Women", "State Police"]
            })
            
            # Update totals
            total_missing += missing
            total_found += found
            total_resolved += resolved
            total_pending += pending
            total_heat_score += heat_score
        
        # Calculate national statistics
        avg_heat_score = total_heat_score / len(states) if states else 0
        
        map_data = {
            "states": states,
            "national_stats": {
                "total_missing": total_missing,
                "total_found": total_found,
                "total_resolved": total_resolved,
                "total_pending": total_pending,
                "total_ai_matches": ai_matches_count,
                "avg_heat_score": round(avg_heat_score, 2)
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return {
            "success": True,
            "data": map_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch intelligence map data: {str(e)}"
        )
