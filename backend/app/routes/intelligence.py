"""
Guardian-Link Intelligence Routes
Analytics and intelligence endpoints for child safety data.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])


@router.get("/dashboard")
async def get_intelligence_dashboard():
    """
    Get national-level intelligence dashboard statistics.
    Returns real data from MongoDB aggregation.
    """
    try:
        national_stats = await analytics_service.get_national_statistics()
        
        if "error" in national_stats:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve national statistics"
            )
        
        if national_stats.get("total_cases", 0) == 0:
            return {
                "success": True,
                "message": "No data available",
                "data": None
            }
        
        return {
            "success": True,
            "data": national_stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard data: {str(e)}"
        )


@router.get("/map")
async def get_intelligence_map():
    """
    Get state-level intelligence data for map visualization.
    Returns real data from MongoDB aggregation with heat scores.
    """
    try:
        state_analytics = await analytics_service.get_state_analytics()
        
        if not state_analytics:
            return {
                "success": True,
                "message": "No data available",
                "data": []
            }
        
        return {
            "success": True,
            "data": state_analytics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve map data: {str(e)}"
        )


@router.get("/state/{state}")
async def get_state_intelligence(state: str):
    """
    Get detailed intelligence for a specific state.
    
    Args:
        state: State name (e.g., "Maharashtra")
    
    Returns:
        State-level analytics with district breakdown
    """
    try:
        # Get state-level analytics
        state_analytics = await analytics_service.get_state_analytics()
        state_data = next((s for s in state_analytics if s["state"].lower() == state.lower()), None)
        
        if not state_data:
            return {
                "success": True,
                "message": "No data available for this state",
                "data": None
            }
        
        # Get district-level analytics for this state
        district_analytics = await analytics_service.get_district_analytics(state=state)
        
        # Get city-level analytics for this state
        city_analytics = await analytics_service.get_city_analytics(state=state)
        
        return {
            "success": True,
            "data": {
                "state": state_data,
                "districts": district_analytics,
                "cities": city_analytics
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve state intelligence: {str(e)}"
        )


@router.get("//district/{district}")
async def get_district_intelligence(district: str, state: Optional[str] = None):
    """
    Get detailed intelligence for a specific district.
    
    Args:
        district: District name (e.g., "Mumbai City")
        state: Optional state filter
    
    Returns:
        District-level analytics with city breakdown
    """
    try:
        # Get district-level analytics
        district_analytics = await analytics_service.get_district_analytics(state=state)
        district_data = next(
            (d for d in district_analytics if d["district"].lower() == district.lower()),
            None
        )
        
        if not district_data:
            return {
                "success": True,
                "message": "No data available for this district",
                "data": None
            }
        
        # Get city-level analytics for this district
        city_analytics = await analytics_service.get_city_analytics(
            state=district_data.get("state"),
            district=district
        )
        
        return {
            "success": True,
            "data": {
                "district": district_data,
                "cities": city_analytics
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve district intelligence: {str(e)}"
        )


@router.get("/city/{city}")
async def get_city_intelligence(city: str, state: Optional[str] = None, district: Optional[str] = None):
    """
    Get detailed intelligence for a specific city.
    
    Args:
        city: City name (e.g., "Mumbai")
        state: Optional state filter
        district: Optional district filter
    
    Returns:
        City-level analytics
    """
    try:
        # Get city-level analytics
        city_analytics = await analytics_service.get_city_analytics(state=state, district=district)
        city_data = next((c for c in city_analytics if c["city"].lower() == city.lower()), None)
        
        if not city_data:
            return {
                "success": True,
                "message": "No data available for this city",
                "data": None
            }
        
        return {
            "success": True,
            "data": city_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve city intelligence: {str(e)}"
        )


@router.get("/trends")
async def get_trend_intelligence():
    """
    Get trend analytics for different time periods.
    Returns real data from MongoDB aggregation.
    
    Returns:
        7-day, 30-day, and monthly trends with growth percentages
    """
    try:
        trend_data = await analytics_service.get_trend_analytics()
        
        if "error" in trend_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve trend analytics"
            )
        
        # Check if there's any data
        total_7d = trend_data.get("last_7_days", {}).get("total", 0)
        total_30d = trend_data.get("last_30_days", {}).get("total", 0)
        current_month = trend_data.get("monthly", {}).get("current_month", 0)
        
        if total_7d == 0 and total_30d == 0 and current_month == 0:
            return {
                "success": True,
                "message": "No data available",
                "data": None
            }
        
        return {
            "success": True,
            "data": trend_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve trend data: {str(e)}"
        )
