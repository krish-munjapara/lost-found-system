/**
 * Guardian-Link — Empty State Component
 * Premium empty state with illustration and CTAs
 */

import React from 'react';
import { Search, UserPlus, Home } from 'lucide-react';

const EmptyState = ({ hasFilters = false, onClearFilters, onReportMissing }) => {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
        {hasFilters ? (
          <Search className="w-10 h-10 text-slate-400" />
        ) : (
          <UserPlus className="w-10 h-10 text-slate-400" />
        )}
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">
        {hasFilters ? 'No Reports Available' : 'No Reports Available Yet'}
      </h3>
      <p className="text-base text-slate-600 max-w-md mb-8 leading-relaxed">
        {hasFilters
          ? 'There are currently no public reports matching your search criteria.'
          : 'There are currently no public reports available. Be the first to help reunite families.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Clear Filters
          </button>
        )}
        <button
          onClick={onReportMissing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Report Missing Child
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
