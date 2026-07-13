/**
 * Guardian-Link — ChildCard Component
 * Card for displaying a child's details (missing or found).
 * Includes social sharing button.
 */

import React, { useState } from 'react';
import { User, MapPin, Clock, ChevronRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../services/api';
import ShareModal from '../common/ShareModal';

const ChildCard = ({ child, type = 'missing', index = 0 }) => {
  const [showShare, setShowShare] = useState(false);

  const statusColors = {
    Critical: 'text-red-600 border-red-100',
    Pending: 'text-amber-600 border-amber-100',
    'Ai Matches': 'text-blue-600 border-blue-100',
    Active: 'text-green-600 border-green-100',
    Resolved: 'text-emerald-600 border-emerald-100',
  };

  const statusColor = statusColors[child.status] || 'text-slate-600 border-slate-100';

  return (
    <>
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all animate-fadeIn group"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Image */}
        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {child.image ? (
            <img
              src={getImageUrl(child.image, type === 'missing' ? 'lost' : 'found', child.image_url)}
              alt={child.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <User className="w-16 h-16" />
            </div>
          )}
          {child.status && (
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white shadow-sm border ${statusColor}`}>
                {child.status}
              </span>
            </div>
          )}

          {/* Share button on hover */}
          {type === 'missing' && (
            <button
              onClick={(e) => { e.preventDefault(); setShowShare(true); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm text-slate-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white"
              title="Share this alert"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-slate-800 mb-2 truncate">{child.name}</h3>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>{child.age} years • {child.gender}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{child.location}</span>
            </div>
          </div>

          {child.description && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-4">
              {child.description}
            </p>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {child.created_at ? new Date(child.created_at).toLocaleDateString() : '—'}
            </div>
            <div className="flex items-center gap-3">
              {type === 'missing' && (
                <button
                  onClick={(e) => { e.preventDefault(); setShowShare(true); }}
                  className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-0.5"
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
              )}
              <Link
                to="/matches"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group-hover:gap-1 transition-all"
              >
                Matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        child={child}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  );
};

export default ChildCard;
