/**
 * Guardian-Link — Public Feed Page
 * ──────────────────────────────────
 * Publicly accessible page (no login required) that displays
 * all reported missing children. Includes:
 * - Live notification ticker/marquee
 * - Search & filter functionality
 * - Social sharing for each child card
 * - Statistics banner
 * - Responsive masonry-style grid
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Shield, Search, AlertTriangle, Users, Target, Heart,
  MapPin, Clock, User, Share2, ChevronRight, ChevronLeft,
  Bell, ArrowRight, ExternalLink, Eye, Phone
} from 'lucide-react';
import { publicApi, shareUtils } from '../services/api';
import ShareModal from '../components/common/ShareModal';

// ──────────────────────────────────────────────
// Alert Ticker — scrolling notification bar
// ──────────────────────────────────────────────
const AlertTicker = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white overflow-hidden relative">
      <div className="flex items-center h-10">
        <div className="bg-red-800/50 px-4 h-full flex items-center gap-2 shrink-0 z-10 border-r border-red-500/30">
          <Bell className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">LIVE ALERTS</span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="animate-ticker flex items-center gap-12 whitespace-nowrap pl-4">
            {[...alerts, ...alerts].map((alert, i) => (
              <span key={i} className="text-xs font-medium inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                🚨 <strong>{alert.name}</strong>, Age {alert.age} — Last seen at {alert.location}
                {alert.created_at && (
                  <span className="text-red-200 ml-1">
                    ({new Date(alert.created_at).toLocaleDateString()})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Public Child Card with Share button
// ──────────────────────────────────────────────
const PublicChildCard = ({ child, index, onShare, isHighlighted }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group animate-fadeIn ${
        isHighlighted
          ? 'border-red-400 ring-4 ring-red-200/50 shadow-red-100'
          : 'border-slate-200 hover:-translate-y-1'
      }`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Image + Status Overlay */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        {child.image ? (
          <img
            src={`/uploads/lost/${child.image}`}
            alt={child.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <User className="w-20 h-20" />
          </div>
        )}

        {/* Urgent badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> MISSING
          </span>
        </div>

        {/* Status badge if matched */}
        {child.status === 'Ai Matches' && (
          <div className="absolute top-3 right-3">
            <span className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
              <Target className="w-3 h-3" /> AI MATCH
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Share button */}
        <button
          onClick={(e) => { e.preventDefault(); onShare(child); }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-500 hover:text-white"
          title="Share this alert"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
          {child.name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{child.age} years old • {child.gender}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{child.location}</span>
          </div>
        </div>

        {child.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {child.description}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {child.created_at
              ? new Date(child.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })
              : '—'
            }
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onShare(child); }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
          >
            <Share2 className="w-3 h-3" /> Share
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Public Feed Page
// ──────────────────────────────────────────────
const PublicFeed = () => {
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [shareChild, setShareChild] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Load data
  useEffect(() => {
    loadFeed();
    loadStats();
    loadAlerts();
  }, [page]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await publicApi.getFeed(page, searchQuery);
      setChildren(data.children || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await publicApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await publicApi.getRecentAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadFeed();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Navigation Bar ── */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">Guardian-Link</span>
                <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-0.5">Child Detection System</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Report a Child
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Alert Ticker ── */}
      <AlertTicker alerts={alerts} />

      {/* ── Hero Section ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
              Public Alert Board — Help Us Find Missing Children
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Every Child{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Deserves
              </span>{' '}
              to Be Found
            </h1>

            <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Browse our public feed of missing children reports. Share these alerts to help reunite families.
              Your share could be the one that brings a child home.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition-opacity" />
                <div className="relative flex items-center bg-white rounded-xl shadow-2xl">
                  <Search className="w-5 h-5 text-slate-400 ml-5" />
                  <input
                    type="text"
                    placeholder="Search by name, location..."
                    className="flex-1 px-4 py-4 bg-transparent text-slate-800 text-base outline-none placeholder-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="m-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Statistics Banner ── */}
      {stats && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Missing Reports', value: stats.missing_count, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
                { label: 'Found Children', value: stats.found_count, icon: Heart, color: 'text-green-600 bg-green-100' },
                { label: 'AI Matches', value: stats.match_count, icon: Target, color: 'text-blue-600 bg-blue-100' },
                { label: 'Cases Resolved', value: stats.resolved_count, icon: Users, color: 'text-purple-600 bg-purple-100' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-800">{stat.value}</div>
                    <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Feed Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              Missing Children Feed
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-[52px]">
              {total} {total === 1 ? 'report' : 'reports'} found • Page {page} of {totalPages}
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Loading reports...</p>
            </div>
          </div>
        ) : children.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {children.map((child, idx) => (
                <PublicChildCard
                  key={child.id || idx}
                  child={child}
                  index={idx}
                  onShare={(c) => setShareChild(c)}
                  isHighlighted={highlightId === child.id}
                />
              ))}
            </div>

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
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Reports Found</h3>
            <p className="text-sm text-slate-500 max-w-md">
              {searchQuery
                ? `No results match "${searchQuery}". Try a different search term.`
                : 'There are no missing children reports at this time.'
              }
            </p>
          </div>
        )}
      </div>

      {/* ── CTA Section ── */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Help Us Bring Children Home</h2>
          <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
            Register with Guardian-Link to report missing or found children. Our AI-powered facial recognition
            system helps match children with existing reports.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:1098"
              className="px-8 py-3.5 rounded-xl bg-white/10 text-white font-bold text-sm border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Emergency: 1098
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-slate-300">Guardian-Link</span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Guardian-Link — Child Detection System. Every child matters.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign In</Link>
              <Link to="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Share Modal ── */}
      <ShareModal
        child={shareChild}
        isOpen={!!shareChild}
        onClose={() => setShareChild(null)}
      />
    </div>
  );
};

export default PublicFeed;
