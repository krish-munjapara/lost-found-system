/**
 * Guardian-Link — Report Card Component
 * Premium card for displaying child reports
 */

import React, { memo } from 'react';
import { MapPin, User, Hash } from 'lucide-react';
import ReportImage from './ReportImage';
import ReportBadge from './ReportBadge';
import CardActions from './CardActions';

const getRelativeDate = (dateString) => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const parseLocation = (location) => {
  if (!location) return { state: '—', district: '—' };
  
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return {
      state: parts[parts.length - 1],
      district: parts[0]
    };
  }
  
  return { state: location, district: '—' };
};

const ReportCard = memo(({ child, onViewDetails, onShare }) => {
  const { state, district } = parseLocation(child.location);
  const relativeDate = getRelativeDate(child.created_at);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group hover:-translate-y-1 active:scale-[0.98]">
      {/* Image Section */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden rounded-t-2xl">
        <ReportImage
          src={child.image_url || child.image}
          alt={child.name}
          className="group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Status Badge */}
        <ReportBadge status={child.status} />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name */}
        <h3 className="text-lg font-bold text-slate-800 mb-3 truncate group-hover:text-blue-600 transition-colors">
          {child.name}
        </h3>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{child.age} yrs • {child.gender}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{state}</span>
          </div>
        </div>

        {/* District */}
        {district !== '—' && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{district}</span>
          </div>
        )}

        {/* Description */}
        {child.description && (
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
            {child.description}
          </p>
        )}

        {/* Report ID */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Hash className="w-3 h-3" />
          <span>#{child.id || '—'}</span>
        </div>

        {/* Actions */}
        <CardActions
          onViewDetails={() => onViewDetails && onViewDetails(child)}
          onShare={() => onShare && onShare(child)}
        />
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
