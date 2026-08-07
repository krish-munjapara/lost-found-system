/**
 * Guardian-Link — Premium News Skeleton Component
 * Elegant skeleton for loading news cards
 */

import React from 'react';

const NewsSkeleton = () => {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white">
      {/* Thumbnail Skeleton */}
      <div className="shrink-0 w-[140px] h-[100px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Headline Skeleton */}
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-3/4 mb-3 animate-pulse" />
        
        {/* Summary Skeleton */}
        <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded mb-2 animate-pulse" />
        <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-5/6 mb-3 animate-pulse" />
        
        {/* Meta Skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-20 bg-gradient-to-r from-slate-100 to-slate-50 rounded animate-pulse" />
          <div className="h-3 w-14 bg-gradient-to-r from-slate-100 to-slate-50 rounded animate-pulse" />
        </div>
        
        {/* Link Skeleton */}
        <div className="h-3 w-24 bg-gradient-to-r from-blue-100 to-blue-50 rounded animate-pulse mt-auto" />
      </div>
    </div>
  );
};

export default NewsSkeleton;
