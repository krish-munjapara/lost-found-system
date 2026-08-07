/**
 * Guardian-Link — Error State Component
 * Premium error state with Retry and Go Home buttons
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

const ErrorState = ({ onRetry, onGoHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-red-200 rounded-2xl bg-red-50/30">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">
        Unable to Load Reports
      </h3>
      <p className="text-base text-slate-600 max-w-md mb-8 leading-relaxed">
        Something went wrong while loading the public reports. Please try again or return to the homepage.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
