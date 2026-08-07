/**
 * Guardian-Link — Premium News Portal
 * Production-grade news portal with search, categories, and infinite scroll
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertCircle, Newspaper, Filter } from 'lucide-react';
import { publicApi } from '../services/api';
import { NewsCard, NewsSkeleton } from '../components/news';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'missing_children', name: 'Missing Children' },
    { id: 'child_safety', name: 'Child Safety' },
    { id: 'rescue_operations', name: 'Rescue Operations' },
    { id: 'child_protection', name: 'Child Protection' },
    { id: 'government', name: 'Government' },
    { id: 'international', name: 'International' },
    { id: 'trafficking', name: 'Trafficking' },
  ];

  const loadNews = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
      setError(false);
    }
    
    try {
      const data = await publicApi.getNews(pageNum, 20, category, searchQuery || null);
      const articles = data.news || [];
      
      if (append) {
        setNews(prev => [...prev, ...articles]);
      } else {
        setNews(articles);
      }
      
      setTotal(data.total || 0);
      setHasMore((pageNum * 20) < data.total);
    } catch (err) {
      console.error('Failed to load news:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery]);

  useEffect(() => {
    setPage(1);
    loadNews(1, false);
  }, [loadNews]);

  const handleRetry = useCallback(() => {
    loadNews(1, false);
  }, [loadNews]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNews(nextPage, true);
  }, [page, loadNews]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    setPage(1);
    loadNews(1, false);
  }, [loadNews]);

  const handleCategoryChange = useCallback((catId) => {
    setCategory(catId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Child Safety News</h1>
                <p className="text-sm text-slate-500 mt-1">Latest updates from verified sources worldwide</p>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </form>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3 mt-6 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && page === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, index) => (
              <NewsSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">
              Unable to load news
            </h3>
            <p className="text-slate-500 mb-8 max-w-md">
              We couldn't fetch the latest news. Please check your connection and try again.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && news.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
              <Newspaper className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">
              No news available
            </h3>
            <p className="text-slate-500 max-w-md">
              {searchQuery 
                ? 'No news matches your search. Try different keywords.' 
                : 'No latest updates available at the moment. Please check back later.'}
            </p>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && news.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Load More ({Math.min((page + 1) * 20, total)} of {total})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
