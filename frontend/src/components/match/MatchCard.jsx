/**
 * Guardian-Link — MatchCard Component
 * Displays an AI match between a missing and found child with visual score.
 */

import React from 'react';
import { User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';

const MatchCard = ({ match, index = 0, onStatusChange }) => {
  const { score, missing, found, status, user_context } = match;
  const { isAdmin } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const getConfidence = (score) => {
    if (score >= 75) return { label: 'High Confidence', color: 'text-green-600', bg: 'bg-green-100', ring: 'text-green-500', track: 'bg-green-50', icon: '✓' };
    if (score >= 50) return { label: 'Medium Confidence', color: 'text-amber-600', bg: 'bg-amber-100', ring: 'text-amber-500', track: 'bg-amber-50', icon: '⚠' };
    return { label: 'Low Confidence', color: 'text-red-600', bg: 'bg-red-100', ring: 'text-red-500', track: 'bg-red-50', icon: '✕' };
  };

  const confidence = getConfidence(score);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleConfirm = async () => {
    if (window.confirm('Are you sure you want to CONFIRM this match?')) {
      setLoading(true);
      try {
        await adminApi.confirmMatch(match.id);
        if (onStatusChange) onStatusChange();
      } catch (err) {
        alert(err.message || 'Failed to confirm match');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = async () => {
    if (window.confirm('Are you sure you want to REJECT this match?')) {
      setLoading(true);
      try {
        await adminApi.rejectMatch(match.id);
        if (onStatusChange) onStatusChange();
      } catch (err) {
        alert(err.message || 'Failed to reject match');
      } finally {
        setLoading(false);
      }
    }
  };

  const PersonCard = ({ person, label, bgColor }) => (
    <div className="flex flex-col items-center flex-1 max-w-[200px]">
      <span className={`w-full text-center py-1 ${bgColor} text-[10px] font-bold uppercase rounded-md mb-3`}>
        {label}
      </span>
      <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-sm mb-3 bg-slate-100 flex items-center justify-center">
        {person.image ? (
          <img
            src={`/uploads/${label.toLowerCase()}/${person.image}`}
            className="w-full h-full object-cover"
            alt={person.name}
          />
        ) : (
          <User className="w-10 h-10 text-slate-300" />
        )}
      </div>
      <h4 className="font-bold text-sm text-slate-800 text-center truncate w-full">{person.name}</h4>
      <p className="text-xs text-slate-500 text-center truncate w-full">{person.age} yrs • {person.location}</p>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-2xl border ${
        status === 'Confirmed' ? 'border-green-300 ring-2 ring-green-100' :
        status === 'Rejected' ? 'border-red-300 opacity-50' :
        'border-slate-200'
      } shadow-sm flex flex-col hover:shadow-md transition-all animate-slideUp`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* User Context Banner (if applicable) */}
      {user_context && !isAdmin && (
        <div className={`px-6 py-3 rounded-t-2xl border-b ${
          user_context.role === 'lost_reporter' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-blue-50 text-blue-800 border-blue-100'
        }`}>
          <h4 className="font-bold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {user_context.heading}
          </h4>
          <p className="text-xs mt-1 opacity-90">{user_context.detail}</p>
        </div>
      )}

      {/* Match Status Banner */}
      <div className="px-6 py-3 border-b flex items-center justify-between bg-slate-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {status === 'Confirmed' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {status === 'Rejected' && <XCircle className="w-4 h-4 text-red-600" />}
          {status === 'Pending' && <AlertCircle className="w-4 h-4 text-amber-500" />}
          <span className={`text-xs font-bold uppercase tracking-wider ${
            status === 'Confirmed' ? 'text-green-700' :
            status === 'Rejected' ? 'text-red-700' :
            'text-amber-600'
          }`}>
            {status} Match
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {new Date(match.timestamp).toLocaleDateString()}
        </span>
      </div>

      <div className="p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
        {/* Missing Person */}
        <PersonCard person={missing} label="Missing" bgColor="bg-red-100 text-red-700" />

        {/* Match Score */}
        <div className="flex flex-col items-center flex-1 py-4 md:py-0">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" className={`fill-none stroke-current ${confidence.track} stroke-[8]`} />
              <circle
                cx="50" cy="50" r="42"
                className={`fill-none stroke-current ${confidence.ring} stroke-[8]`}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${confidence.color}`}>{score}%</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Match</span>
            </div>
          </div>

          <span className={`px-3 py-1 text-xs font-bold rounded-full ${confidence.bg} ${confidence.color} mb-4`}>
            {confidence.icon} {confidence.label}
          </span>

          <div className="w-full max-w-xs px-4">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>Similarity</span>
              <span className={confidence.color}>{score}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Found Person */}
        <PersonCard person={found} label="Found" bgColor="bg-green-100 text-green-700" />
      </div>

      {/* Admin Review Actions */}
      {isAdmin && status === 'Pending' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
          >
            Reject Match
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Verify Match
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
