/**
 * Guardian-Link — Report Badge Component
 * Animated status badge for report cards
 */

import React, { memo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ReportBadge = memo(({ status }) => {
  const statusLower = status?.toLowerCase() || 'missing';
  
  let badgeConfig = {
    color: 'bg-red-500',
    label: 'MISSING',
    icon: AlertTriangle
  };

  if (statusLower.includes('found')) {
    badgeConfig = {
      color: 'bg-green-500',
      label: 'FOUND',
      icon: CheckCircle
    };
  } else if (statusLower.includes('reunited')) {
    badgeConfig = {
      color: 'bg-blue-500',
      label: 'REUNITED',
      icon: CheckCircle
    };
  }

  const StatusIcon = badgeConfig.icon;

  return (
    <div className="absolute top-3 right-3">
      <span className={`${badgeConfig.color} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 hover:scale-105 transition-transform duration-200`}>
        <StatusIcon className="w-3 h-3" /> {badgeConfig.label}
      </span>
    </div>
  );
});

ReportBadge.displayName = 'ReportBadge';

export default ReportBadge;
