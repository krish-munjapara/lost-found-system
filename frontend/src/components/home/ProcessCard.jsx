/**
 * Guardian-Link — Process Card Component
 * Premium card for displaying process steps
 */

import React, { memo } from 'react';
import { ArrowRight } from 'lucide-react';

const ProcessCard = memo(({ 
  icon: Icon, 
  title, 
  description, 
  step, 
  onClick,
  isLast = false 
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98] p-6"
      role="button"
      tabIndex={0}
      aria-label={`Learn more about ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Step Number */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
        {step}
      </div>

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors duration-300">
        <Icon className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
        {description}
      </p>

      {/* Arrow Indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
      </div>

      {/* Connection Arrow (Desktop) */}
      {!isLast && (
        <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      )}
    </div>
  );
});

ProcessCard.displayName = 'ProcessCard';

export default ProcessCard;
