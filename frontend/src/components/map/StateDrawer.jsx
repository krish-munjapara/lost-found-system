/**
 * Guardian-Link — State Drawer Component
 * Animated side drawer showing detailed state information
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Clock, Phone, Building, MapPin, TrendingUp } from 'lucide-react';

const StateDrawer = ({ state, isOpen, onClose }) => {
  if (!state) return null;

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

  const total = state.missing + state.found + state.resolved + state.pending;
  const foundPercentage = total > 0 ? ((state.found / total) * 100).toFixed(1) : 0;
  const resolvedPercentage = total > 0 ? ((state.resolved / total) * 100).toFixed(1) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{state.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getHeatColor(state.heat_level)}`} />
                    <span className={`text-sm font-semibold ${getHeatTextColor(state.heat_level)}`}>
                      {state.heat_level.toUpperCase()} HEAT ZONE
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Heat Score */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Heat Score</span>
                  <span className="text-lg font-bold text-slate-900">{(state.heat_score * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${state.heat_score * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-2 rounded-full ${getHeatColor(state.heat_level)}`}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600">MISSING</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{state.missing}</p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-green-600">FOUND</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{state.found}</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">RESOLVED</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{state.resolved}</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600">PENDING</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{state.pending}</p>
                </div>
              </div>

              {/* AI Matches */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-purple-600">AI Matches</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{state.ai_matches}</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Resolution Progress</h3>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Found Rate</span>
                    <span className="text-xs font-semibold text-green-600">{foundPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${foundPercentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-2 rounded-full bg-green-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Resolved Rate</span>
                    <span className="text-xs font-semibold text-blue-600">{resolvedPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resolvedPercentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-2 rounded-full bg-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Top Cities */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Top Cities</h3>
                <div className="space-y-2">
                  {state.top_cities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{city.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-red-500">{city.missing} missing</p>
                          <p className="text-xs text-green-500">{city.found} found</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Numbers */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Emergency Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {state.emergency_numbers.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-600">{number}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Government Contacts */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Government Contacts</h3>
                <div className="space-y-2">
                  {state.government_contacts.map((contact, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{contact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Updated */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Last Updated</span>
                  <span>{new Date(state.last_updated).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StateDrawer;
