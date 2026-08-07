/**
 * Guardian-Link — Latest Updates Section Component
 * Premium panel for displaying child safety news updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { NewsCard, NewsSkeleton } from '../news';

const LatestUpdatesSection = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    
    try {
      const data = await publicApi.getNews(1, 3, 'all', null);
      setNews(data.news || []);
    } catch (err) {
      console.error('Failed to load news:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleRetry = useCallback(() => {
    loadNews();
  }, [loadNews]);

  const handleViewMore = useCallback(() => {
    navigate('/news');
  }, [navigate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-1.5">
          Latest Child Safety Updates
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Stay informed with verified child safety news, awareness campaigns and official updates.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2.5 flex-1">
          {[...Array(3)].map((_, index) => (
            <NewsSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1.5">
            Unable to load updates
          </h3>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 mb-3">
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-600">
            No latest updates available.
          </p>
        </div>
      )}

      {/* News List */}
      {!loading && !error && news.length > 0 && (
        <>
          <div className="space-y-2.5 flex-1">
            {news.slice(0, 3).map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>

          {/* View More Link */}
          <button
            onClick={handleViewMore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group mt-4"
          >
            View More Updates
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
};

export default LatestUpdatesSection;
