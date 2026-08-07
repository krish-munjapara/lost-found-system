/**
 * Guardian-Link — Public Feed Section Component
 * Premium layout for browsing child reports with search and filters
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { publicApi } from '../../services/api';
import ShareModal from '../common/ShareModal';
import PublicFeedHeader from '../publicfeed/PublicFeedHeader';
import PublicFeedToolbar from '../publicfeed/PublicFeedToolbar';
import StatusTabs from '../publicfeed/StatusTabs';
import ReportCard from '../publicfeed/ReportCard';
import ReportGrid from '../publicfeed/ReportGrid';
import ReportSkeleton from '../publicfeed/ReportSkeleton';
import EmptyState from '../publicfeed/EmptyState';
import ErrorState from '../publicfeed/ErrorState';
import FilterDrawer from '../publicfeed/FilterDrawer';
import FilterChips from '../publicfeed/FilterChips';

const PublicFeedSection = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [shareChild, setShareChild] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [availableStates, setAvailableStates] = useState([
    'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 
    'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'West Bengal'
  ]);

  // Initialize filters with default values
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    age: '',
    state: '',
    city: '',
    date: '',
    sort: 'newest'
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Check for filter from navbar navigation
  useEffect(() => {
    const feedFilter = localStorage.getItem('feedFilter');
    if (feedFilter) {
      setFilters(prev => ({ ...prev, status: feedFilter }));
      localStorage.removeItem('feedFilter');
    }
  }, []);

  // Load feed when filters change
  useEffect(() => {
    loadFeed();
  }, [page, searchQuery, filters.status, filters.gender, filters.age, filters.state, filters.city, filters.date, filters.sort]);

  const loadFeed = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await publicApi.getFeed(page, searchQuery, filters);
      setChildren(data.children || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleFilterRemove = useCallback((key) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
    setPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      status: '',
      gender: '',
      age: '',
      state: '',
      city: '',
      date: '',
      sort: 'newest'
    });
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, sort: value }));
    setPage(1);
  }, []);

  const handleTabChange = useCallback((status) => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  }, []);

  const handleViewDetails = (child) => {
    // Placeholder for view details functionality
    console.log('View details for:', child.id);
  };

  const handleShare = (child) => {
    setShareChild(child);
  };

  const handleReportMissing = () => {
    // Navigate to report missing child page (legitimate page navigation)
    window.location.href = '/report-missing';
  };

  const handleGoHome = () => {
    // Navigate to home page (legitimate page navigation)
    window.location.href = '/';
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value !== 'newest');
  }, [filters]);

  return (
    <section id="public-feed" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <PublicFeedHeader />

        {/* Toolbar */}
        <PublicFeedToolbar 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onFilterClick={() => setFilterDrawerOpen(true)}
          sortValue={filters.sort}
          onSortChange={handleSortChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          availableStates={availableStates}
        />

        {/* Status Tabs */}
        <StatusTabs 
          activeTab={filters.status}
          onTabChange={handleTabChange}
        />

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <FilterChips 
            filters={filters}
            onRemove={handleFilterRemove}
            onClearAll={handleClearAllFilters}
          />
        )}

        {/* Loading State */}
        {loading && (
          <ReportGrid>
            {[...Array(6)].map((_, index) => (
              <ReportSkeleton key={index} />
            ))}
          </ReportGrid>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorState 
            onRetry={loadFeed}
            onGoHome={handleGoHome}
          />
        )}

        {/* Empty State */}
        {!loading && !error && children.length === 0 && (
          <EmptyState 
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearAllFilters}
            onReportMissing={handleReportMissing}
          />
        )}

        {/* Report Grid */}
        {!loading && !error && children.length > 0 && (
          <>
            <ReportGrid>
              {children.map((child, idx) => (
                <ReportCard
                  key={child.id || idx}
                  child={child}
                  onViewDetails={handleViewDetails}
                  onShare={handleShare}
                />
              ))}
            </ReportGrid>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                          page === pageNum
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Drawer (Mobile) */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        availableStates={availableStates}
      />

      {/* Share Modal */}
      <ShareModal
        child={shareChild}
        isOpen={!!shareChild}
        onClose={() => setShareChild(null)}
      />
    </section>
  );
};

export default PublicFeedSection;
