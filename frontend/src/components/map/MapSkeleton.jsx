/**
 * Guardian-Link — Map Skeleton Component
 * Loading skeleton for the intelligence map
 */

import React from 'react';
import { motion } from 'framer-motion';

const MapSkeleton = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Map Skeleton */}
        <div className="relative w-full aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
          
          {/* State Placeholders */}
          <div className="absolute inset-0 p-8 grid grid-cols-3 gap-4">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="bg-slate-200/50 rounded-lg animate-pulse"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-slate-100 rounded-xl p-4 animate-pulse"
              style={{
                animationDelay: `${index * 0.15}s`
              }}
            >
              <div className="h-4 bg-slate-200 rounded mb-2" />
              <div className="h-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapSkeleton;
