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

from app.database import get_db
from app.utils import serialize_doc

router = APIRouter(prefix="/api/public", tags=["Public Feed"])


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
    """
    try:
        db = get_db()
        
        # State code mapping for Indian states
        state_mapping = {
            'MH': 'Maharashtra', 'DL': 'Delhi', 'KA': 'Karnataka', 'TN': 'Tamil Nadu',
            'UP': 'Uttar Pradesh', 'GJ': 'Gujarat', 'RJ': 'Rajasthan', 'WB': 'West Bengal',
            'MP': 'Madhya Pradesh', 'AP': 'Andhra Pradesh', 'TS': 'Telangana', 'KL': 'Kerala',
            'PB': 'Punjab', 'HR': 'Haryana', 'BR': 'Bihar', 'OR': 'Odisha',
            'AS': 'Assam', 'JH': 'Jharkhand', 'CT': 'Chhattisgarh', 'UT': 'Uttarakhand',
            'HP': 'Himachal Pradesh', 'JK': 'Jammu & Kashmir', 'GA': 'Goa', 'MN': 'Manipur',
            'MZ': 'Mizoram', 'NL': 'Nagaland', 'TR': 'Tripura', 'ML': 'Meghalaya',
            'AR': 'Arunachal Pradesh', 'SK': 'Sikkim', 'AN': 'Andaman and Nicobar',
            'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli and Daman and Diu',
            'LD': 'Ladakh', 'PY': 'Puducherry'
        }
        
        # City/district to state mapping for better location matching
        city_to_state = {
            # Maharashtra
            'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'thane': 'Maharashtra',
            'nashik': 'Maharashtra', 'aurangabad': 'Maharashtra', 'solapur': 'Maharashtra',
            # Delhi
            'new delhi': 'Delhi', 'delhi': 'Delhi', 'noida': 'Delhi', 'ghaziabad': 'Delhi',
            'gurgaon': 'Haryana', 'faridabad': 'Haryana',
            # Karnataka
            'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka', 'hubli': 'Karnataka',
            # Tamil Nadu
            'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'salem': 'Tamil Nadu',
            # Uttar Pradesh
            'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh',
            'allahabad': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh',
            # Gujarat
            'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat',
            # Rajasthan
            'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'udaipur': 'Rajasthan', 'kota': 'Rajasthan',
            # West Bengal
            'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal',
            # Madhya Pradesh
            'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
            # Andhra Pradesh
            'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'tirupati': 'Andhra Pradesh',
            # Telangana
            'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana',
            # Kerala
            'thiruvananthapuram': 'Kerala', 'kochi': 'Kerala', 'kollam': 'Kerala', 'kozhikode': 'Kerala',
            # Punjab
            'chandigarh': 'Punjab', 'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab',
            # Haryana
            'panipat': 'Haryana', 'karnal': 'Haryana', 'rohtak': 'Haryana', 'hisar': 'Haryana',
            # Bihar
            'patna': 'Bihar', 'gaya': 'Bihar', 'bhagalpur': 'Bihar', 'muzaffarpur': 'Bihar',
            # Odisha
            'bhubaneswar': 'Odisha', 'cuttack': 'Odisha', 'puri': 'Odisha', 'rourkela': 'Odisha',
            # Assam
            'guwahati': 'Assam', 'dibrugarh': 'Assam', 'silchar': 'Assam', 'jorhat': 'Assam',
            # Jharkhand
            'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand', 'dhanbad': 'Jharkhand', 'bokaro': 'Jharkhand',
            # Chhattisgarh
            'raipur': 'Chhattisgarh', 'bilaspur': 'Chhattisgarh', 'durg': 'Chhattisgarh', 'korba': 'Chhattisgarh',
            # Uttarakhand
            'dehradun': 'Uttarakhand', 'haridwar': 'Uttarakhand', 'rishikesh': 'Uttarakhand',
            # Himachal Pradesh
            'shimla': 'Himachal Pradesh', 'dharamshala': 'Himachal Pradesh', 'manali': 'Himachal Pradesh',
            # Jammu & Kashmir
            'srinagar': 'Jammu & Kashmir', 'jammu': 'Jammu & Kashmir', 'leh': 'Ladakh',
            # Goa
            'panaji': 'Goa', 'margao': 'Goa', 'vasco': 'Goa',
            # North East
            'imphal': 'Manipur', 'aizawl': 'Mizoram', 'kohima': 'Nagaland', 'agartala': 'Tripura',
            'shillong': 'Meghalaya', 'itanagar': 'Arunachal Pradesh', 'gangtok': 'Sikkim',
        }
        
        def get_state_from_location(location):
            """Extract state from location string using city mapping and state names."""
            location_lower = location.lower()
            
            # First check city mapping
            for city, state in city_to_state.items():
                if city in location_lower:
                    return state
            
            # Then check state names directly
            for state_code, state_name in state_mapping.items():
                if state_name.lower() in location_lower:
                    return state_name
            
            return None
        
        # Aggregate state-wise statistics from children collection
        pipeline = [
            {
                "$group": {
                    "_id": "$location",
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
            location = doc["_id"]
            state_stats[location] = {
                "missing": doc["missing"],
                "found": 0,  # Will be updated from children_found
                "resolved": doc["resolved"],
                "pending": doc["pending"]
            }
        
        # Get found children by location
        found_pipeline = [
            {
                "$group": {
                    "_id": "$location",
                    "found": {"$sum": 1}
                }
            }
        ]
        
        async for doc in db.children_found.aggregate(found_pipeline):
            location = doc["_id"]
            if location in state_stats:
                state_stats[location]["found"] = doc["found"]
            else:
                state_stats[location] = {
                    "missing": 0,
                    "found": doc["found"],
                    "resolved": 0,
                    "pending": 0
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
            # Try to find matching location in state_stats using improved matching
            state_data = None
            for location, stats in state_stats.items():
                matched_state = get_state_from_location(location)
                if matched_state and matched_state == state_name:
                    state_data = stats
                    break
            
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
                {"$match": {"location": {"$regex": state_name, "$options": "i"}}},
                {"$group": {"_id": "$location", "count": {"$sum": 1}}},
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
                "last_updated": "2026-07-18T00:00:00Z",
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
            "last_updated": "2026-07-18T00:00:00Z"
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
