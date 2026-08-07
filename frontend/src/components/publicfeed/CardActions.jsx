/**
 * Guardian-Link — Card Actions Component
 * View Details and Share buttons for report cards
 */

import React, { memo } from 'react';
import { ArrowRight, Share2 } from 'lucide-react';

const CardActions = memo(({ onViewDetails, onShare }) => {
  return (
    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
      <button
        onClick={onViewDetails}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.95] group"
      >
        View Details
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 ease-out" />
      </button>
      <button
        onClick={onShare}
        className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-[0.95]"
        aria-label="Share report"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
});

CardActions.displayName = 'CardActions';

export default CardActions;
