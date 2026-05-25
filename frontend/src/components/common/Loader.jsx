/**
 * Guardian-Link — Loader Component
 * Full-screen and inline loading indicators.
 */

import React from 'react';
import { Shield } from 'lucide-react';

const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg animate-pulse-slow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-blue-500/20 animate-ping" />
        </div>
        <p className="text-slate-600 font-medium text-sm animate-pulse">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
        <p className="text-sm text-slate-500 font-medium">{text}</p>
      </div>
    </div>
  );
};

export default Loader;
