/**
 * Guardian-Link — Map Tooltip Component
 * Beautiful floating tooltip for state statistics
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

const MapTooltip = ({ state, position, visible }) => {
  if (!state || !visible) return null;

  const getHeatColor = (heatLevel) => {
    const colors = {
      gray: 'bg-gray-400',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[heatLevel] || colors.gray;
  };

  const getHeatTextColor = (heatLevel) => {
    const colors = {
      gray: 'text-gray-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    };
    return colors[heatLevel] || colors.gray;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[280px]">
            {/* State Name */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{state.name}</h3>
              <div className={`w-3 h-3 rounded-full ${getHeatColor(state.heat_level)}`} />
            </div>

            {/* Heat Level Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 mb-3">
              <Activity className="w-3 h-3 text-slate-500" />
              <span className={`text-xs font-semibold ${getHeatTextColor(state.heat_level)}`}>
                {state.heat_level.toUpperCase()} HEAT
              </span>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-red-50 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-slate-600">Missing</span>
                </div>
                <p className="text-sm font-bold text-red-600">{state.missing}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-slate-600">Found</span>
                </div>
                <p className="text-sm font-bold text-green-600">{state.found}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-slate-600">Resolved</span>
                </div>
                <p className="text-sm font-bold text-blue-600">{state.resolved}</p>
              </div>

              <div className="bg-amber-50 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-slate-600">Pending</span>
                </div>
                <p className="text-sm font-bold text-amber-600">{state.pending}</p>
              </div>
            </div>

            {/* AI Matches */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">AI Matches</span>
              <span className="text-xs font-bold text-purple-600">{state.ai_matches}</span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">Last Updated</span>
              <span className="text-xs text-slate-400">
                {new Date(state.last_updated).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="w-4 h-4 bg-white border-r border-b border-slate-200 transform rotate-45 mx-auto -mt-2" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapTooltip;
