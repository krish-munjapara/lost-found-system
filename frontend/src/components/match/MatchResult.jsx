/**
 * Guardian-Link — MatchResult Component
 * Summary component showing overall match statistics.
 */

import React from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const MatchResult = ({ matches = [] }) => {
  const highCount = matches.filter(m => m.score >= 75).length;
  const medCount = matches.filter(m => m.score >= 50 && m.score < 75).length;
  const lowCount = matches.filter(m => m.score < 50).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-green-700">{highCount}</h4>
          <p className="text-xs font-medium text-green-600">High Confidence</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-amber-700">{medCount}</h4>
          <p className="text-xs font-medium text-amber-600">Medium Confidence</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 sm:col-span-2 lg:col-span-1">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-red-700">{lowCount}</h4>
          <p className="text-xs font-medium text-red-600">Low Confidence</p>
        </div>
      </div>
    </div>
  );
};

export default MatchResult;
