/**
 * Guardian-Link — India Child Safety Intelligence Map
 * Production-grade interactive dashboard for child safety statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, TrendingUp, MapPin, Activity } from 'lucide-react';
import { publicApi } from '../services/api';
import IndiaMap from '../components/map/IndiaMap';
import MapTooltip from '../components/map/MapTooltip';
import StateDrawer from '../components/map/StateDrawer';
import MapSkeleton from '../components/map/MapSkeleton';

const IntelligenceMap = () => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadMapData = useCallback(async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await publicApi.getIntelligenceMap();
      setMapData(response.data);
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

  const handleStateClick = useCallback((state) => {
    setSelectedState(state.id);
    setDrawerOpen(true);
  }, []);

  const handleStateHover = useCallback((state, isHovering) => {
    if (isHovering) {
      setHoveredState(state);
      setShowTooltip(true);
    } else {
      setHoveredState(null);
      setShowTooltip(false);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY - 20
    });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedState(null);
  }, []);

  const handleRetry = useCallback(() => {
    loadMapData();
  }, [loadMapData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">India Child Safety Intelligence Map</h1>
            <p className="text-slate-600">Real-time child safety statistics across all Indian states</p>
          </div>
          <MapSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load map data</h2>
          <p className="text-slate-600 mb-4">Please try again later</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { states, national_stats } = mapData;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            India Child Safety Intelligence Map
          </h1>
          <p className="text-slate-600">
            Real-time child safety statistics across all Indian states
          </p>
        </motion.div>

        {/* National Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-600">Total Missing</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{national_stats.total_missing.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-600">Total Found</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{national_stats.total_found.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-600">Total Resolved</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{national_stats.total_resolved.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-600">Total Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{national_stats.total_pending.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-600">AI Matches</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{national_stats.total_ai_matches.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600">Avg Heat</span>
            </div>
            <p className="text-2xl font-bold text-slate-600">{(national_stats.avg_heat_score * 100).toFixed(0)}%</p>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6"
        >
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-sm font-semibold text-slate-700">Heat Level:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span className="text-xs text-slate-600">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-xs text-slate-600">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-xs text-slate-600">Critical</span>
            </div>
          </div>

          {/* Map */}
          <div className="relative h-[600px] md:h-[700px]">
            <IndiaMap
              states={states}
              onStateClick={handleStateClick}
              onStateHover={handleStateHover}
              selectedState={selectedState}
              hoveredState={hoveredState?.id}
            />
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-center text-xs text-slate-400"
        >
          Last Updated: {new Date(mapData.last_updated).toLocaleString()}
        </motion.div>
      </div>

      {/* Tooltip */}
      <MapTooltip
        state={hoveredState}
        position={tooltipPosition}
        visible={showTooltip}
      />

      {/* State Drawer */}
      <StateDrawer
        state={selectedState ? states.find(s => s.id === selectedState) : null}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default IntelligenceMap;
