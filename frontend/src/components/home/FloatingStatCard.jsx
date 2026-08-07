/**
 * Guardian-Link — Floating Stat Card Component
 * Glassmorphic stat cards for Hero section
 */

import React from 'react';

const FloatingStatCard = ({ icon: Icon, label, value, position, delay = 0 }) => {
  const positionStyles = {
    'top-left': 'top-8 left-0',
    'top-right': 'top-16 right-0',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-0 right-8',
  };

  return (
    <div
      className={`absolute ${positionStyles[position]} bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-blue-500/10 p-4 animate-fadeIn hover:shadow-2xl hover:shadow-blue-500/20 transition-shadow duration-300`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  );
};

export default FloatingStatCard;
