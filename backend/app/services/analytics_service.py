"""
Guardian-Link Analytics Service
Intelligence Engine for child safety analytics.
Uses MongoDB aggregation pipelines for real-time analytics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.database import get_db
from app.utils import get_timestamp


class AnalyticsService:
    """Service for calculating intelligence analytics from MongoDB."""
    
    def __init__(self):
        self.db = get_db()
    
    # ──────────────────────────────────────────────
    # HEAT SCORE CALCULATION
    # ──────────────────────────────────────────────
    """
    Heat Score Formula (0-100 scale):
    
    The heat score represents the risk level of a region based on multiple factors.
    Higher score = Higher risk.
    
    Formula:
    Heat Score = (Missing Factor * 0.30) + 
                 (Pending Ratio Factor * 0.25) + 
                 (Recent Reports Factor * 0.20) + 
                 (Resolution Inverse Factor * 0.15) + 
                 (AI Match Inverse Factor * 0.10)
    
    Where:
    - Missing Factor = (missing_count / max_missing) * 100
      Normalizes missing count against the maximum in the dataset
    
    - Pending Ratio Factor = (pending_count / total_cases) * 100
      Percentage of cases that are still pending
    
    - Recent Reports Factor = (recent_7d_count / total_cases) * 100
      Percentage of cases reported in the last 7 days
    
    - Resolution Inverse Factor = (1 - resolution_rate) * 100
      Inverse of resolution rate (lower resolution = higher risk)
    
    - AI Match Inverse Factor = (1 - ai_match_success_rate) * 100
      Inverse of AI match success (lower success = higher risk)
    
    Risk Levels:
    - 0-20: Low Risk (Green)
    - 21-40: Moderate Risk (Yellow)
    - 41-60: High Risk (Orange)
    - 61-80: Very High Risk (Red)
    - 81-100: Critical Risk (Dark Red)
    """
    
    @staticmethod
    def calculate_heat_score(
        missing_count: int,
        pending_count: int,
        total_cases: int,
        recent_7d_count: int,
        resolved_count: int,
        ai_match_count: int,
        max_missing: int = 100
    ) -> Dict[str, Any]:
        """
        Calculate heat score based on multiple risk factors.
        
        Args:
            missing_count: Total missing cases in region
            pending_count: Pending cases in region
            total_cases: Total cases in region
            recent_7d_count: Cases reported in last 7 days
            resolved_count: Resolved cases in region
            ai_match_count: AI matches found in region
            max_missing: Maximum missing count for normalization (default: 100)
        
        Returns:
            Dictionary with heat_score and risk_level
        """
        if total_cases == 0:
            return {"heat_score": 0, "risk_level": "Low Risk"}
        
        # Calculate individual factors
        missing_factor = (missing_count / max(max_missing, 1)) * 100
        pending_ratio = (pending_count / total_cases) * 100 if total_cases > 0 else 0
        recent_factor = (recent_7d_count / total_cases) * 100 if total_cases > 0 else 0
        resolution_rate = (resolved_count / total_cases) * 100 if total_cases > 0 else 0
        ai_match_success = (ai_match_count / total_cases) * 100 if total_cases > 0 else 0
        
        # Calculate heat score (weighted sum)
        heat_score = (
            (missing_factor * 0.30) +
            (pending_ratio * 0.25) +
            (recent_factor * 0.20) +
            ((100 - resolution_rate) * 0.15) +
            ((100 - ai_match_success) * 0.10)
        )
        
        # Normalize to 0-100
        heat_score = min(max(heat_score, 0), 100)
        
        # Determine risk level
        if heat_score <= 20:
            risk_level = "Low Risk"
        elif heat_score <= 40:
            risk_level = "Moderate Risk"
        elif heat_score <= 60:
            risk_level = "High Risk"
        elif heat_score <= 80:
            risk_level = "Very High Risk"
        else:
            risk_level = "Critical Risk"
        
        return {
            "heat_score": round(heat_score, 2),
            "risk_level": risk_level,
            "factors": {
                "missing_factor": round(missing_factor, 2),
                "pending_ratio": round(pending_ratio, 2),
                "recent_factor": round(recent_factor, 2),
                "resolution_rate": round(resolution_rate, 2),
                "ai_match_success": round(ai_match_success, 2)
            }
        }
    
    # ──────────────────────────────────────────────
    # NATIONAL STATISTICS
    # ──────────────────────────────────────────────
    async def get_national_statistics(self) -> Dict[str, Any]:
        """
        Get national-level statistics using MongoDB aggregation.
        
        Returns:
            Dictionary with total counts and rates
        """
        try:
            # Aggregate missing children
            missing_pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_missing": {"$sum": 1},
                        "total_pending": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Pending"]}, 1, 0]}
                        },
                        "total_resolved": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]}
                        },
                        "ai_matches": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Ai Matches"]}, 1, 0]}
                        }
                    }
                }
            ]
            
            missing_result = await self.db.children.aggregate(missing_pipeline).to_list(length=1)
            missing_stats = missing_result[0] if missing_result else {
                "total_missing": 0,
                "total_pending": 0,
                "total_resolved": 0,
                "ai_matches": 0
            }
            
            # Aggregate found children
            found_pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_found": {"$sum": 1}
                    }
                }
            ]
            
            found_result = await self.db.children_found.aggregate(found_pipeline).to_list(length=1)
            found_stats = found_result[0] if found_result else {"total_found": 0}
            
            # Calculate rates
            total_cases = missing_stats["total_missing"] + found_stats["total_found"]
            resolution_rate = (
                (missing_stats["total_resolved"] / missing_stats["total_missing"] * 100)
                if missing_stats["total_missing"] > 0 else 0
            )
            
            return {
                "total_missing": missing_stats["total_missing"],
                "total_found": found_stats["total_found"],
                "total_pending": missing_stats["total_pending"],
                "total_resolved": missing_stats["total_resolved"],
                "ai_matches": missing_stats["ai_matches"],
                "resolution_rate": round(resolution_rate, 2),
                "total_cases": total_cases,
                "last_updated": get_timestamp().isoformat()
            }
            
        except Exception as e:
            print(f"[ANALYTICS] Error calculating national statistics: {e}")
            return {"error": str(e)}
    
    # ──────────────────────────────────────────────
    # STATE ANALYTICS
    # ──────────────────────────────────────────────
    async def get_state_analytics(self) -> List[Dict[str, Any]]:
        """
        Get state-level analytics using MongoDB aggregation.
        
        Returns:
            List of state statistics with heat scores
        """
        try:
            # Aggregate by state from children collection
            state_pipeline = [
                {
                    "$match": {
                        "location_structured.state": {"$exists": True, "$ne": None}
                    }
                },
                {
                    "$group": {
                        "_id": "$location_structured.state",
                        "missing_count": {"$sum": 1},
                        "pending_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Pending"]}, 1, 0]}
                        },
                        "resolved_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]}
                        },
                        "ai_match_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Ai Matches"]}, 1, 0]}
                        },
                        "recent_7d": {
                            "$sum": {
                                "$cond": [
                                    {"$gte": ["$created_at", datetime.utcnow() - timedelta(days=7)]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    "$sort": {"missing_count": -1}
                }
            ]
            
            state_results = await self.db.children.aggregate(state_pipeline).to_list(length=None)
            
            # Get found children by state
            found_pipeline = [
                {
                    "$match": {
                        "location_structured.state": {"$exists": True, "$ne": None}
                    }
                },
                {
                    "$group": {
                        "_id": "$location_structured.state",
                        "found_count": {"$sum": 1}
                    }
                }
            ]
            
            found_results = await self.db.children_found.aggregate(found_pipeline).to_list(length=None)
            
            # Create lookup dictionary for found counts
            found_lookup = {item["_id"]: item["found_count"] for item in found_results}
            
            # Calculate heat scores and combine results
            analytics = []
            max_missing = max([item["missing_count"] for item in state_results], default=1)
            
            for state_data in state_results:
                state_name = state_data["_id"]
                found_count = found_lookup.get(state_name, 0)
                total_cases = state_data["missing_count"] + found_count
                
                # Calculate heat score
                heat_result = self.calculate_heat_score(
                    missing_count=state_data["missing_count"],
                    pending_count=state_data["pending_count"],
                    total_cases=total_cases,
                    recent_7d_count=state_data["recent_7d"],
                    resolved_count=state_data["resolved_count"],
                    ai_match_count=state_data["ai_match_count"],
                    max_missing=max_missing
                )
                
                # Calculate resolution percentage
                resolution_pct = (
                    (state_data["resolved_count"] / state_data["missing_count"] * 100)
                    if state_data["missing_count"] > 0 else 0
                )
                
                analytics.append({
                    "state": state_name,
                    "missing": state_data["missing_count"],
                    "found": found_count,
                    "pending": state_data["pending_count"],
                    "resolved": state_data["resolved_count"],
                    "ai_matches": state_data["ai_match_count"],
                    "resolution_percentage": round(resolution_pct, 2),
                    "heat_score": heat_result["heat_score"],
                    "risk_level": heat_result["risk_level"],
                    "recent_7d": state_data["recent_7d"],
                    "last_updated": get_timestamp().isoformat()
                })
            
            return analytics if analytics else []
            
        except Exception as e:
            print(f"[ANALYTICS] Error calculating state analytics: {e}")
            return []
    
    # ──────────────────────────────────────────────
    # DISTRICT ANALYTICS
    # ──────────────────────────────────────────────
    async def get_district_analytics(self, state: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get district-level analytics using MongoDB aggregation.
        
        Args:
            state: Optional state filter
        
        Returns:
            List of district statistics with heat scores
        """
        try:
            # Build match filter
            match_filter = {
                "location_structured.district": {"$exists": True, "$ne": None}
            }
            if state:
                match_filter["location_structured.state"] = state
            
            # Aggregate by district
            district_pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "state": "$location_structured.state",
                            "district": "$location_structured.district"
                        },
                        "missing_count": {"$sum": 1},
                        "pending_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Pending"]}, 1, 0]}
                        },
                        "resolved_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]}
                        },
                        "ai_match_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Ai Matches"]}, 1, 0]}
                        },
                        "recent_7d": {
                            "$sum": {
                                "$cond": [
                                    {"$gte": ["$created_at", datetime.utcnow() - timedelta(days=7)]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    "$sort": {"missing_count": -1}
                }
            ]
            
            district_results = await self.db.children.aggregate(district_pipeline).to_list(length=None)
            
            # Get found children by district
            found_pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "state": "$location_structured.state",
                            "district": "$location_structured.district"
                        },
                        "found_count": {"$sum": 1}
                    }
                }
            ]
            
            found_results = await self.db.children_found.aggregate(found_pipeline).to_list(length=None)
            
            # Create lookup dictionary
            found_lookup = {
                (item["_id"]["state"], item["_id"]["district"]): item["found_count"]
                for item in found_results
            }
            
            # Calculate heat scores
            analytics = []
            max_missing = max([item["missing_count"] for item in district_results], default=1)
            
            for district_data in district_results:
                state_name = district_data["_id"]["state"]
                district_name = district_data["_id"]["district"]
                found_count = found_lookup.get((state_name, district_name), 0)
                total_cases = district_data["missing_count"] + found_count
                
                heat_result = self.calculate_heat_score(
                    missing_count=district_data["missing_count"],
                    pending_count=district_data["pending_count"],
                    total_cases=total_cases,
                    recent_7d_count=district_data["recent_7d"],
                    resolved_count=district_data["resolved_count"],
                    ai_match_count=district_data["ai_match_count"],
                    max_missing=max_missing
                )
                
                resolution_pct = (
                    (district_data["resolved_count"] / district_data["missing_count"] * 100)
                    if district_data["missing_count"] > 0 else 0
                )
                
                analytics.append({
                    "state": state_name,
                    "district": district_name,
                    "missing": district_data["missing_count"],
                    "found": found_count,
                    "pending": district_data["pending_count"],
                    "resolved": district_data["resolved_count"],
                    "ai_matches": district_data["ai_match_count"],
                    "resolution_percentage": round(resolution_pct, 2),
                    "heat_score": heat_result["heat_score"],
                    "risk_level": heat_result["risk_level"],
                    "recent_7d": district_data["recent_7d"],
                    "last_updated": get_timestamp().isoformat()
                })
            
            return analytics if analytics else []
            
        except Exception as e:
            print(f"[ANALYTICS] Error calculating district analytics: {e}")
            return []
    
    # ──────────────────────────────────────────────
    # CITY ANALYTICS
    # ──────────────────────────────────────────────
    async def get_city_analytics(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get city-level analytics using MongoDB aggregation.
        
        Args:
            state: Optional state filter
            district: Optional district filter
        
        Returns:
            List of city statistics with heat scores
        """
        try:
            # Build match filter
            match_filter = {
                "location_structured.city": {"$exists": True, "$ne": None}
            }
            if state:
                match_filter["location_structured.state"] = state
            if district:
                match_filter["location_structured.district"] = district
            
            # Aggregate by city
            city_pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "state": "$location_structured.state",
                            "district": "$location_structured.district",
                            "city": "$location_structured.city"
                        },
                        "missing_count": {"$sum": 1},
                        "pending_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Pending"]}, 1, 0]}
                        },
                        "resolved_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]}
                        },
                        "ai_match_count": {
                            "$sum": {"$cond": [{"$eq": ["$status", "Ai Matches"]}, 1, 0]}
                        },
                        "recent_7d": {
                            "$sum": {
                                "$cond": [
                                    {"$gte": ["$created_at", datetime.utcnow() - timedelta(days=7)]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    "$sort": {"missing_count": -1}
                }
            ]
            
            city_results = await self.db.children.aggregate(city_pipeline).to_list(length=None)
            
            # Get found children by city
            found_pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "state": "$location_structured.state",
                            "district": "$location_structured.district",
                            "city": "$location_structured.city"
                        },
                        "found_count": {"$sum": 1}
                    }
                }
            ]
            
            found_results = await self.db.children_found.aggregate(found_pipeline).to_list(length=None)
            
            # Create lookup dictionary
            found_lookup = {
                (item["_id"]["state"], item["_id"]["district"], item["_id"]["city"]): item["found_count"]
                for item in found_results
            }
            
            # Calculate heat scores
            analytics = []
            max_missing = max([item["missing_count"] for item in city_results], default=1)
            
            for city_data in city_results:
                state_name = city_data["_id"]["state"]
                district_name = city_data["_id"]["district"]
                city_name = city_data["_id"]["city"]
                found_count = found_lookup.get((state_name, district_name, city_name), 0)
                total_cases = city_data["missing_count"] + found_count
                
                heat_result = self.calculate_heat_score(
                    missing_count=city_data["missing_count"],
                    pending_count=city_data["pending_count"],
                    total_cases=total_cases,
                    recent_7d_count=city_data["recent_7d"],
                    resolved_count=city_data["resolved_count"],
                    ai_match_count=city_data["ai_match_count"],
                    max_missing=max_missing
                )
                
                resolution_pct = (
                    (city_data["resolved_count"] / city_data["missing_count"] * 100)
                    if city_data["missing_count"] > 0 else 0
                )
                
                analytics.append({
                    "state": state_name,
                    "district": district_name,
                    "city": city_name,
                    "missing": city_data["missing_count"],
                    "found": found_count,
                    "pending": city_data["pending_count"],
                    "resolved": city_data["resolved_count"],
                    "ai_matches": city_data["ai_match_count"],
                    "resolution_percentage": round(resolution_pct, 2),
                    "heat_score": heat_result["heat_score"],
                    "risk_level": heat_result["risk_level"],
                    "recent_7d": city_data["recent_7d"],
                    "last_updated": get_timestamp().isoformat()
                })
            
            return analytics if analytics else []
            
        except Exception as e:
            print(f"[ANALYTICS] Error calculating city analytics: {e}")
            return []
    
    # ──────────────────────────────────────────────
    # TREND ANALYTICS
    # ──────────────────────────────────────────────
    async def get_trend_analytics(self) -> Dict[str, Any]:
        """
        Get trend analytics for different time periods.
        
        Returns:
            Dictionary with 7-day, 30-day, and monthly trends
        """
        try:
            now = datetime.utcnow()
            last_7d = now - timedelta(days=7)
            last_30d = now - timedelta(days=30)
            last_month_start = now.replace(day=1)
            prev_month_start = (last_month_start - timedelta(days=1)).replace(day=1)
            
            # 7-day trend
            pipeline_7d = [
                {
                    "$match": {
                        "created_at": {"$gte": last_7d}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at"
                            }
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$sort": {"_id": 1}
                }
            ]
            
            results_7d = await self.db.children.aggregate(pipeline_7d).to_list(length=None)
            total_7d = sum(item["count"] for item in results_7d)
            
            # 30-day trend
            pipeline_30d = [
                {
                    "$match": {
                        "created_at": {"$gte": last_30d}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at"
                            }
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$sort": {"_id": 1}
                }
            ]
            
            results_30d = await self.db.children.aggregate(pipeline_30d).to_list(length=None)
            total_30d = sum(item["count"] for item in results_30d)
            
            # Monthly trend (current month vs previous month)
            pipeline_current_month = [
                {
                    "$match": {
                        "created_at": {"$gte": last_month_start}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            current_month_result = await self.db.children.aggregate(pipeline_current_month).to_list(length=1)
            current_month_count = current_month_result[0]["count"] if current_month_result else 0
            
            pipeline_prev_month = [
                {
                    "$match": {
                        "created_at": {
                            "$gte": prev_month_start,
                            "$lt": last_month_start
                        }
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            prev_month_result = await self.db.children.aggregate(pipeline_prev_month).to_list(length=1)
            prev_month_count = prev_month_result[0]["count"] if prev_month_result else 0
            
            # Calculate growth/decline percentages
            monthly_growth = 0
            if prev_month_count > 0:
                monthly_growth = ((current_month_count - prev_month_count) / prev_month_count) * 100
            
            # Calculate 30-day vs 7-day growth
            prev_7d_start = last_7d - timedelta(days=7)
            pipeline_prev_7d = [
                {
                    "$match": {
                        "created_at": {
                            "$gte": prev_7d_start,
                            "$lt": last_7d
                        }
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            prev_7d_result = await self.db.children.aggregate(pipeline_prev_7d).to_list(length=1)
            prev_7d_count = prev_7d_result[0]["count"] if prev_7d_result else 0
            
            weekly_growth = 0
            if prev_7d_count > 0:
                weekly_growth = ((total_7d - prev_7d_count) / prev_7d_count) * 100
            
            return {
                "last_7_days": {
                    "total": total_7d,
                    "daily_breakdown": [
                        {"date": item["_id"], "count": item["count"]}
                        for item in results_7d
                    ],
                    "growth_percentage": round(weekly_growth, 2)
                },
                "last_30_days": {
                    "total": total_30d,
                    "daily_breakdown": [
                        {"date": item["_id"], "count": item["count"]}
                        for item in results_30d
                    ]
                },
                "monthly": {
                    "current_month": current_month_count,
                    "previous_month": prev_month_count,
                    "growth_percentage": round(monthly_growth, 2)
                },
                "last_updated": get_timestamp().isoformat()
            }
            
        except Exception as e:
            print(f"[ANALYTICS] Error calculating trend analytics: {e}")
            return {"error": str(e)}


# Global analytics service instance
analytics_service = AnalyticsService()
