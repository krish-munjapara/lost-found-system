/**
 * Guardian-Link — Premium News Card Component
 * Modern Google News/Inshorts-style card with professional design
 */

import React, { memo } from 'react';
import { ExternalLink, Clock, CheckCircle } from 'lucide-react';

const NewsCard = memo(({ news }) => {
  const getRelativeTime = (dateString) => {
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
      day: 'numeric'
    });
  };

  const handleImageError = (e) => {
    e.target.src = '/assets/news-placeholder.svg';
    e.target.onerror = null;
  };

  const handleCardClick = () => {
    if (news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all duration-300 group cursor-pointer bg-white"
      onClick={handleCardClick}
    >
      {/* Thumbnail - Left side */}
      <div className="shrink-0 w-[140px] h-[100px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden relative">
        {news.image ? (
          <img
            src={news.image}
            alt={news.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <img
            src="/assets/news-placeholder.svg"
            alt="News placeholder"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content - Right side */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Headline */}
        <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {news.headline}
        </h3>

        {/* Summary */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3 flex-1">
          {news.summary}
        </p>

        {/* Meta - Source and Time */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span className="truncate font-medium">{news.source}</span>
          </div>
          <span className="text-xs text-slate-300">•</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{getRelativeTime(news.publishedAt)}</span>
          </div>
        </div>

        {/* Read More Link */}
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Read full article: ${news.headline}`}
        >
          Read Full Article
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;
