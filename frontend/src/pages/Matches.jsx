/**
 * Guardian-Link — Matches Page
 * Displays AI match results using MatchCard and MatchResult components.
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import MatchCard from '../components/match/MatchCard';
import MatchResult from '../components/match/MatchResult';
import { Target, Filter } from 'lucide-react';
import { matchesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Pending, Confirmed, Rejected
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await matchesApi.getAll();
      console.log('API Response:', data);
      console.log('API Response Type:', typeof data);
      console.log('API Response Is Array:', Array.isArray(data));
      console.log('API Response Length:', Array.isArray(data) ? data.length : 'N/A');
      if (Array.isArray(data) && data.length > 0) {
        console.log('First Match:', data[0]);
      }
      setMatches(data);
      console.log('React State Set. Matches:', data);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'All') return true;
    return m.status === filter;
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            AI Match Results
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            {isAdmin 
              ? "Review and verify potential matches identified by AI across all users." 
              : "Potential matches identified using AI-powered facial similarity analysis for your reports."}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {['All', 'Pending', 'Confirmed', 'Rejected'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === opt 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Match Summary */}
      {!loading && matches.length > 0 && <MatchResult matches={matches} />}

      {/* Match Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full" />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filteredMatches.map((m, idx) => (
            <MatchCard 
              key={m.id || idx} 
              match={m} 
              index={idx} 
              onStatusChange={loadMatches} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
          <Target className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No {filter !== 'All' ? filter.toLowerCase() : ''} matches found</h3>
          <p className="text-sm text-slate-500">
            {filter !== 'All' 
              ? `There are no matches currently in the ${filter} state.`
              : 'AI matches will appear here when missing and found reports are compared.'}
          </p>
        </div>
      )}
    </Layout>
  );
};

export default Matches;
