/**
 * Guardian-Link — ReportCard Component
 * Summary card showing a report's key info.
 */

import React from 'react';
import { MapPin, Clock, User } from 'lucide-react';

const ReportCard = ({ report, type = 'missing' }) => {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 shadow-sm">
        {report.image ? (
          <img
            src={type === 'missing' ? `/uploads/lost/${report.image}` : `/uploads/found/${report.image}`}
            alt={report.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
            {(report.name || 'UN').substring(0, 2)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-slate-900 truncate">{report.name}</h4>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
          {report.location}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          report.status === 'Active' || report.status === 'Ai Matches'
            ? 'bg-green-100 text-green-700'
            : report.status === 'Critical'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {report.status || 'Pending'}
        </span>
        <span className="text-xs text-slate-400">
          {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
        </span>
      </div>
    </div>
  );
};

export default ReportCard;
