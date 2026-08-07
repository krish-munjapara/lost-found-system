"""
Guardian-Link Location Model
Structured location schema with geospatial support.
"""

from pydantic import BaseModel, Field
from typing import Optional


class Location(BaseModel):
    """Structured location data for child reports."""
    country: str = Field(default="India", description="Country name")
    state: str = Field(..., min_length=2, max_length=50, description="State name")
    district: Optional[str] = Field(None, min_length=2, max_length=50, description="District name")
    city: str = Field(..., min_length=2, max_length=50, description="City name")
    address: Optional[str] = Field(None, max_length=200, description="Street address")
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$", description="6-digit Indian PIN code")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")
    
    def to_geojson_point(self) -> Optional[dict]:
        """Convert to GeoJSON Point format."""
        if self.latitude is not None and self.longitude is not None:
            return {
                "type": "Point",
                "coordinates": [self.longitude, self.latitude]
            }
        return None
    
    def to_legacy_string(self) -> str:
        """Convert to legacy location string format."""
        if self.latitude and self.longitude:
            return f"Lat: {self.latitude}, Lon: {self.longitude}"
        return f"{self.city}, {self.state}, {self.country}"


class LocationUpdate(BaseModel):
    """Location update schema (all fields optional)."""
    country: Optional[str] = Field(None, min_length=2, max_length=50)
    state: Optional[str] = Field(None, min_length=2, max_length=50)
    district: Optional[str] = Field(None, min_length=2, max_length=50)
    city: Optional[str] = Field(None, min_length=2, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
