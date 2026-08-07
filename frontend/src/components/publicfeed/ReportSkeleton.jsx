/**
 * Guardian-Link — Report Skeleton Component
 * Premium skeleton loader that closely matches actual card layout
 */

import React from 'react';

const ReportSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse rounded-t-2xl relative">
        {/* Status Badge Skeleton */}
        <div className="absolute top-3 right-3 w-16 h-6 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      
      {/* Content Skeleton */}
      <div className="p-5">
        {/* Name Skeleton */}
        <div className="h-6 bg-slate-100 rounded-lg mb-3 animate-pulse" />
        
        {/* Info Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </div>
        
        {/* District Skeleton */}
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-4 animate-pulse" />
        
        {/* Description Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
        </div>
        
        {/* Report ID Skeleton */}
        <div className="h-3 bg-slate-100 rounded w-16 mb-4 animate-pulse" />
        
        {/* Actions Skeleton */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="flex-1 h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ReportSkeleton;
