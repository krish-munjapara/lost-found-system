/**
 * Guardian-Link — Statistics Skeleton Component
 * Elegant skeleton loaders for statistics cards
 */

import React from 'react';

const StatisticsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          {/* Icon Skeleton */}
          <div className="w-14 h-14 rounded-xl bg-slate-100 mb-4 animate-pulse" />
          
          {/* Number Skeleton */}
          <div className="h-10 bg-slate-100 rounded-lg mb-2 animate-pulse" />
          
          {/* Label Skeleton */}
          <div className="h-5 bg-slate-100 rounded w-3/4 mb-2 animate-pulse" />
          
          {/* Description Skeleton */}
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default StatisticsSkeleton;
