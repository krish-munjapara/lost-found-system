/**
 * Guardian-Link — India Child Safety Intelligence Dashboard
 * Premium GIS implementation with react-simple-maps
 * Production-grade government dashboard
 */

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Activity, Phone, Building, MapPin, TrendingUp, ArrowUp, ArrowDown, Shield } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { publicApi } from '../../services/api';

// Memoized Geography component for performance
const MemoizedGeography = memo(({ geography, fill, stroke, strokeWidth, style, className, onMouseEnter, onMouseLeave, onClick }) => (
  <Geography
    geography={geography}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    style={style}
    className={className}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
  />
));

MemoizedGeography.displayName = 'MemoizedGeography';

const IndiaMapSection = () => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [error, setError] = useState(false);

  // State name mapping for India TopoJSON to backend state IDs
  const stateNameMapping = useMemo(() => ({
    'Andaman and Nicobar': 'AN',
    'Andhra Pradesh': 'AP',
    'Arunachal Pradesh': 'AR',
    'Assam': 'AS',
    'Bihar': 'BR',
    'Chandigarh': 'CH',
    'Chhattisgarh': 'CT',
    'Dadra and Nagar Haveli and Daman and Diu': 'DN',
    'Delhi': 'DL',
    'Goa': 'GA',
    'Gujarat': 'GJ',
    'Haryana': 'HR',
    'Himachal Pradesh': 'HP',
    'Jammu and Kashmir': 'JK',
    'Jharkhand': 'JH',
    'Karnataka': 'KA',
    'Kerala': 'KL',
    'Ladakh': 'LD',
    'Lakshadweep': 'LD',
    'Madhya Pradesh': 'MP',
    'Maharashtra': 'MH',
    'Manipur': 'MN',
    'Meghalaya': 'ML',
    'Mizoram': 'MZ',
    'Nagaland': 'NL',
    'Odisha': 'OR',
    'Puducherry': 'PY',
    'Punjab': 'PB',
    'Rajasthan': 'RJ',
    'Sikkim': 'SK',
    'Tamil Nadu': 'TN',
    'Telangana': 'TG',
    'Tripura': 'TR',
    'Uttar Pradesh': 'UP',
    'Uttarakhand': 'UT',
    'West Bengal': 'WB'
  }), []);

  const getBackendStateId = useCallback((stateName) => {
    return stateNameMapping[stateName] || stateName;
  }, [stateNameMapping]);

  const loadMapData = useCallback(async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await publicApi.getIntelligenceMap();
      setMapData(response.data || response);
    } catch (err) {
      console.error('Failed to load map data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const getHeatColor = useCallback((heatLevel) => {
    const colors = {
      gray: '#CBD5E1',
      green: '#22C55E',
      yellow: '#EAB308',
      orange: '#F97316',
      red: '#EF4444'
    };
    return colors[heatLevel] || colors.gray;
  }, []);

  const getHeatTextColor = useCallback((heatLevel) => {
    const colors = {
      gray: 'text-slate-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    };
    return colors[heatLevel] || colors.gray;
  }, []);

  const handleStateHover = useCallback((geography, isHovering) => {
    const stateName = geography.properties.name;
    const backendId = getBackendStateId(stateName);
    
    if (isHovering) {
      const state = mapData?.states.find(s => s.id === backendId);
      if (state) setHoveredState(state);
    } else {
      setHoveredState(null);
    }
  }, [mapData, getBackendStateId]);

  const handleStateClick = useCallback((geography) => {
    const stateName = geography.properties.name;
    const backendId = getBackendStateId(stateName);
    
    const state = mapData?.states.find(s => s.id === backendId);
    if (state) {
      setSelectedState(backendId);
    }
  }, [mapData, getBackendStateId]);

  const handleMapLeave = useCallback(() => {
    if (!selectedState) {
      setHoveredState(null);
    }
  }, [selectedState]);

  const handleDeselect = useCallback(() => {
    setSelectedState(null);
    setHoveredState(null);
  }, []);

  const displayState = useMemo(() => {
    return hoveredState || (selectedState ? mapData?.states.find(s => s.id === selectedState) : null);
  }, [hoveredState, selectedState, mapData]);

  // Check if database has no data
  const hasNoData = useMemo(() => {
    if (!mapData?.national_stats) return false;
    const { total_missing, total_found, total_resolved, total_pending } = mapData.national_stats;
    return total_missing === 0 && total_found === 0 && total_resolved === 0 && total_pending === 0;
  }, [mapData]);

  if (loading) {
    return (
      <section id="india-map" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Coverage Across India
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real-time child safety statistics across all Indian states
            </p>
          </div>
          <div className="h-[600px] bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="india-map" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Coverage Across India
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Unable to load map data. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (hasNoData) {
    return (
      <section id="india-map" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Coverage Across India
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real-time child safety statistics across all Indian states
            </p>
          </div>
          <div className="h-[600px] bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
            <MapPin className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Data Available</h3>
            <p className="text-slate-500 max-w-md">
              Child safety statistics will appear here once reports are submitted. Start by reporting a missing or found child.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { states, national_stats } = mapData;

  return (
    <section id="india-map" className="py-6 lg:py-8 bg-gradient-to-b from-slate-50 to-white max-h-[560px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Powered by Guardian Link AI
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-1">
            Coverage Across India
          </h2>
          <p className="text-sm lg:text-base text-slate-600 max-w-2xl mx-auto">
            Real-time Child Safety Intelligence Dashboard
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 h-[440px]">
          {/* Left Side - Map (70%) */}
          <div className="lg:col-span-7">
            <div 
              className="relative h-full rounded-2xl overflow-hidden shadow-2xl"
              onMouseLeave={handleMapLeave}
            >
              {/* Premium Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-slate-50/90 to-blue-100/80">
                {/* GIS Grid Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748B" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                {/* Contour Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="contour" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    <circle cx="50%" cy="50%" r="30%" fill="url(#contour)" />
                    <circle cx="50%" cy="50%" r="50%" fill="url(#contour)" />
                    <circle cx="50%" cy="50%" r="70%" fill="url(#contour)" />
                  </svg>
                </div>
              </div>

              {/* Floating Heat Level Legend */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-lg px-4 py-2 z-20">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Heat Level</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-[9px] text-slate-600">No</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[9px] text-slate-600">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-[9px] text-slate-600">Med</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-[9px] text-slate-600">High</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[9px] text-slate-600">Crit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deselect Button */}
              {selectedState && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleDeselect}
                  className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-lg px-3 py-1.5 z-20 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Clear Selection
                </motion.button>
              )}

              {/* SVG Map */}
              <div className="relative z-10 flex items-center justify-center p-3 h-full">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 1150,
                    center: [78, 23],
                    rotate: [0, 0, 0]
                  }}
                  width={720}
                  height={820}
                  className="w-full h-full"
                >
                  <Geographies
                    geographyUrl="https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json"
                    onError={(error) => {
                      console.error('GeoJSON loading error:', error);
                      setError(true);
                    }}
                  >
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const stateName = geo.properties.name;
                        const backendId = getBackendStateId(stateName);
                        const stateData = states?.find(s => s.id === backendId);
                        const isSelected = selectedState === backendId;
                        const isHovered = hoveredState?.id === backendId;
                        
                        return (
                          <MemoizedGeography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={stateData ? getHeatColor(stateData.heat_level) : '#CBD5E1'}
                            stroke={isSelected ? '#2563EB' : isHovered ? '#ffffff' : '#ffffff'}
                            strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                            style={{
                              default: { outline: 'none' },
                              hover: { 
                                outline: 'none',
                                filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.7))',
                                transform: 'scale(1.02)',
                                transformOrigin: 'center'
                              },
                              pressed: { outline: 'none' }
                            }}
                            className="cursor-pointer transition-all duration-180 ease-out hover:opacity-90"
                            onMouseEnter={() => handleStateHover(geo, true)}
                            onMouseLeave={() => handleStateHover(geo, false)}
                            onClick={() => handleStateClick(geo)}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              </div>
            </div>
          </div>

          {/* Right Side - Information Panel (30%) */}
          <div className="lg:col-span-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-xl p-4 h-full overflow-y-auto">
              <AnimatePresence mode="wait">
                {displayState ? (
                  <motion.div
                    key="state-details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {/* State Name */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">{displayState.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getHeatColor(displayState.heat_level)}`} />
                    </div>

                    {/* Heat Level Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                      <Activity className="w-3 h-3 text-slate-500" />
                      <span className={`text-xs font-bold uppercase tracking-wide ${getHeatTextColor(displayState.heat_level)}`}>
                        {displayState.heat_level} Heat
                      </span>
                    </div>

                    {/* Heat Score */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600">Heat Score</span>
                        <span className="text-lg font-bold text-slate-900">{(displayState.heat_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${displayState.heat_score * 100}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className={`h-2 rounded-full ${getHeatColor(displayState.heat_level)}`}
                        />
                      </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-red-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-xs font-semibold text-slate-600">Missing</span>
                        </div>
                        <p className="text-xl font-bold text-red-600">{displayState.missing}</p>
                      </div>

                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-semibold text-slate-600">Found</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">{displayState.found}</p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-600">Resolved</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{displayState.resolved}</p>
                      </div>

                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-600">Pending</span>
                        </div>
                        <p className="text-xl font-bold text-amber-600">{displayState.pending}</p>
                      </div>
                    </div>

                    {/* AI Matches */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600">AI Matches</span>
                        </div>
                        <span className="text-xl font-bold text-purple-600">{displayState.ai_matches}</span>
                      </div>
                    </div>

                    {/* Resolution Rate */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600">Resolution Rate</span>
                        <span className="text-sm font-bold text-green-600">
                          {((displayState.resolved / (displayState.missing + displayState.found + displayState.resolved + displayState.pending)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(displayState.resolved / (displayState.missing + displayState.found + displayState.resolved + displayState.pending)) * 100}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="h-2 rounded-full bg-green-500"
                        />
                      </div>
                    </div>

                    {/* Top Cities */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">Top Cities</h4>
                      <div className="space-y-2">
                        {displayState.top_cities.slice(0, 2).map((city, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="text-xs font-medium text-slate-700">{city.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-red-500">{city.missing}</span>
                              <span className="text-xs font-semibold text-green-500">{city.found}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Numbers */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">Emergency</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayState.emergency_numbers.slice(0, 2).map((number, index) => (
                          <a
                            key={index}
                            href={`tel:${number}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-semibold text-red-600">{number}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Government Contacts */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">Contacts</h4>
                      <div className="space-y-2">
                        {displayState.government_contacts.slice(0, 2).map((contact, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-700 truncate">{contact}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Updated</span>
                        <span>{new Date(displayState.last_updated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="national-overview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-bold text-slate-900">National Dashboard</h3>

                    {/* National Statistics */}
                    <div className="space-y-2">
                      <div className="bg-red-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-semibold text-slate-600">Total Missing</span>
                          </div>
                          <span className="text-xl font-bold text-red-600">{national_stats.total_missing.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-semibold text-slate-600">Total Found</span>
                          </div>
                          <span className="text-xl font-bold text-green-600">{national_stats.total_found.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-slate-600">Total Resolved</span>
                          </div>
                          <span className="text-xl font-bold text-blue-600">{national_stats.total_resolved.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-semibold text-slate-600">AI Matches</span>
                          </div>
                          <span className="text-xl font-bold text-purple-600">{national_stats.total_ai_matches.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Average Heat Score */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600">Avg Heat Score</span>
                        <span className="text-lg font-bold text-slate-900">{(national_stats.avg_heat_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${national_stats.avg_heat_score * 100}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="h-2 rounded-full bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Highest Risk State */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ArrowDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-slate-700">Highest Risk</span>
                      </div>
                      <div className="bg-red-50 rounded-xl p-2">
                        <span className="text-sm font-bold text-red-600">
                          {states.reduce((worst, state) => state.heat_score > worst.heat_score ? state : worst).name}
                        </span>
                      </div>
                    </div>

                    {/* Safest State */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ArrowUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-semibold text-slate-700">Safest State</span>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2">
                        <span className="text-sm font-bold text-green-600">
                          {states.reduce((best, state) => state.heat_score < best.heat_score ? state : best).name}
                        </span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Updated</span>
                        <span>{new Date(mapData.last_updated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndiaMapSection;
