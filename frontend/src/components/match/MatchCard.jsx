/**
 * Guardian-Link — MatchCard Component
 * Displays an AI match between a missing and found child with visual score.
 */

import React from 'react';
import { User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, childrenApi, getImageUrl } from '../../services/api';

const MatchCard = ({ match, index = 0, onStatusChange }) => {
  const {
    score: rawScore,
    missing,
    found,
    status,
    user_context,
    missing_id,
    missing_report_id,
    found_id,
    found_report_id,
    missing_reporter,
    found_reporter,
    similarity_score,
    created_at,
    timestamp,
  } = match || {};

  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [resolvedMissing, setResolvedMissing] = React.useState(null);
  const [resolvedFound, setResolvedFound] = React.useState(null);

  // Accept both missing_id and missing_report_id (same for found)
  const effectiveMissingId = missing_id || missing_report_id || null;
  const effectiveFoundId = found_id || found_report_id || null;

  const score = Number(rawScore ?? similarity_score ?? 0);
  const matchId = match?.id || match?._id || match?.match_id;
  const timestampValue = timestamp || created_at || '';

  // Determine which report belongs to the logged-in user
  const userEmail = user?.email;
  const isUserMissingReport = !isAdmin && userEmail && missing_reporter === userEmail;
  const isUserFoundReport = !isAdmin && userEmail && found_reporter === userEmail;

  // Helper function to format display ID from public_id
  const formatDisplayId = (publicId, reportType) => {
    if (!publicId) return 'N/A';
    
    // Extract the last part of the path (the hash)
    const parts = publicId.split('/');
    const hash = parts[parts.length - 1];
    
    // Take first 8 characters and convert to uppercase
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    // Determine prefix based on report type or public_id content
    const isLost = reportType === 'lost' || publicId.includes('/lost/');
    const prefix = isLost ? 'GL-LST' : 'GL-FND';
    
    return `${prefix}-${shortHash}`;
  };

  // Compact Report Card Component
  const CompactReportCard = ({ person, label, folder, reportId, isUserReport }) => {
    const safePerson = person || {};
    const imageValue = safePerson?.image || safePerson?.image_url || safePerson?.photo_url || null;
    const personName = safePerson?.name || 'Unknown';
    const personAge = safePerson?.age || 'N/A';
    const personLocation = safePerson?.location || 'Unknown';
    const publicId = safePerson?.public_id || reportId || 'N/A';
    
    const dateField = folder === 'lost' ? safePerson?.date_missing : safePerson?.date_found;
    const formattedDate = dateField ? new Date(dateField).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const displayId = formatDisplayId(publicId, folder);
    
    const isMissing = folder === 'lost';
    const labelColor = isMissing ? 'text-red-600' : 'text-green-600';

    return (
      <div className="flex gap-3 items-start">
        {/* Image */}
        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          {imageValue ? (
            <img
              src={getImageUrl(imageValue, folder, safePerson?.image_url)}
              className="w-full h-full object-cover"
              alt={personName}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className={`text-[10px] font-bold uppercase tracking-wider ${labelColor} mb-1`}>
            {label}
          </div>

          {/* Report ID */}
          <div className="text-[9px] font-mono text-slate-500 mb-2">
            {displayId}
          </div>

          {/* Name */}
          <div className="font-semibold text-sm text-slate-800 truncate mb-1">
            {personName}
          </div>

          {/* Details */}
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-600">
              {personAge} years old
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {personLocation}
            </div>
            <div className="text-[10px] text-slate-400">
              {formattedDate}
            </div>
          </div>

          {/* Action */}
          <button className="mt-2 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
            {isUserReport ? 'View My Report →' : 'View Matched Report →'}
          </button>
        </div>
      </div>
    );
  };

  const getConfidence = (value) => {
    if (value >= 75) return { label: 'High Confidence', color: 'text-green-600', bg: 'bg-green-100', ring: 'text-green-500', track: 'bg-green-50', icon: '✓' };
    if (value >= 50) return { label: 'Medium Confidence', color: 'text-amber-600', bg: 'bg-amber-100', ring: 'text-amber-500', track: 'bg-amber-50', icon: '⚠' };
    return { label: 'Low Confidence', color: 'text-red-600', bg: 'bg-red-100', ring: 'text-red-500', track: 'bg-red-50', icon: '✕' };
  };

  React.useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      if (missing || found) return;
      if (!effectiveMissingId && !effectiveFoundId) return;

      try {
        const [missingPayload, foundPayload] = await Promise.all([
          childrenApi.getMissing(),
          childrenApi.getFound(),
        ]);

        const missingList = Array.isArray(missingPayload) ? missingPayload : missingPayload?.children || missingPayload?.matches || [];
        const foundList = Array.isArray(foundPayload) ? foundPayload : foundPayload?.children || foundPayload?.matches || [];

        const resolvedMissingItem = missingList.find(
          (item) => String(item?.id || item?._id) === String(effectiveMissingId)
        ) || null;
        const resolvedFoundItem = foundList.find(
          (item) => String(item?.id || item?._id) === String(effectiveFoundId)
        ) || null;

        if (!cancelled) {
          setResolvedMissing(resolvedMissingItem);
          setResolvedFound(resolvedFoundItem);
        }
      } catch (error) {
        console.error('Failed to load match child details:', error);
        if (!cancelled) {
          setResolvedMissing(null);
          setResolvedFound(null);
        }
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [missing, found, effectiveMissingId, effectiveFoundId]);

  const confidence = getConfidence(score);

  const handleConfirm = async () => {
    if (window.confirm('Are you sure you want to CONFIRM this match?')) {
      setLoading(true);
      try {
        await adminApi.confirmMatch(matchId);
        onStatusChange?.();
      } catch (err) {
        alert(err?.message || 'Failed to confirm match');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = async () => {
    if (window.confirm('Are you sure you want to REJECT this match?')) {
      setLoading(true);
      try {
        await adminApi.rejectMatch(matchId);
        onStatusChange?.();
      } catch (err) {
        alert(err?.message || 'Failed to reject match');
      } finally {
        setLoading(false);
      }
    }
  };

  // Normalize status string for safe check
  const normalizedStatus = status?.toLowerCase() || '';

  // Determine display-friendly status label
  const displayStatus = (normalizedStatus === 'pending' || normalizedStatus === 'pending_review') ? 'Pending Review'
    : normalizedStatus === 'confirmed' ? 'Confirmed'
    : normalizedStatus === 'rejected' ? 'Rejected'
    : status || 'Unknown';

  const missingPerson = missing || resolvedMissing || { name: 'Unknown', age: 'N/A', location: 'Unknown' };
  const foundPerson = found || resolvedFound || { name: 'Unknown', age: 'N/A', location: 'Unknown' };

  return (
    <div
      className={`bg-white rounded-lg border w-full max-w-full ${
        normalizedStatus === 'confirmed' ? 'border-green-300' :
        normalizedStatus === 'rejected' ? 'border-red-300 opacity-50' :
        'border-slate-200'
      } shadow-sm hover:shadow-md transition-all animate-slideUp`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* User Context Banner (if applicable) */}
      {user_context && !isAdmin && (
        <div className={`px-4 py-2 border-b ${
          user_context?.role === 'lost_reporter' ? 'bg-red-50/50 text-red-700 border-red-100' : 'bg-blue-50/50 text-blue-700 border-blue-100'
        }`}>
          <h4 className="font-semibold text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            {user_context?.heading}
          </h4>
          <p className="text-[10px] mt-0.5 opacity-90">{user_context?.detail}</p>
        </div>
      )}

      {/* Match Status Header */}
      <div className="px-4 py-2.5 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Potential Match</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            normalizedStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
            normalizedStatus === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {displayStatus}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {timestampValue ? new Date(timestampValue).toLocaleDateString() : '—'}
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* User's Report (LEFT) */}
          <div className={`py-3 lg:py-4 px-2 lg:px-4 ${isUserMissingReport ? 'border-l-2 border-l-blue-200 bg-blue-50/30' : 'border-l-2 border-l-blue-200 bg-blue-50/30'}`}>
            {isUserMissingReport ? (
              <CompactReportCard 
                person={missingPerson} 
                label="YOUR MISSING REPORT" 
                folder="lost" 
                reportId={effectiveMissingId}
                isUserReport={true}
              />
            ) : (
              <CompactReportCard 
                person={foundPerson} 
                label="YOUR FOUND REPORT" 
                folder="found" 
                reportId={effectiveFoundId}
                isUserReport={true}
              />
            )}
          </div>

          {/* AI Match Center */}
          <div className="py-3 lg:py-4 px-4 lg:px-6 flex flex-col items-center justify-center min-w-[140px]">
            <div className="text-center space-y-2">
              <div>
                <span className={`text-2xl sm:text-3xl font-bold ${confidence.color}`}>{score.toFixed(1)}%</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Match</div>
              <div className={`text-[10px] font-medium ${confidence.color}`}>{confidence.label}</div>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Other User's Report (RIGHT) */}
          <div className="py-3 lg:py-4 px-2 lg:px-4">
            {isUserMissingReport ? (
              <CompactReportCard 
                person={foundPerson} 
                label="MATCHED FOUND REPORT" 
                folder="found" 
                reportId={effectiveFoundId}
                isUserReport={false}
              />
            ) : (
              <CompactReportCard 
                person={missingPerson} 
                label="MATCHED MISSING REPORT" 
                folder="lost" 
                reportId={effectiveMissingId}
                isUserReport={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Admin Review Actions */}
      {isAdmin && (normalizedStatus === 'pending' || normalizedStatus === 'pending_review') && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
