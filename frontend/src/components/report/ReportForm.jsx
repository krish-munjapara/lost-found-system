/**
 * Guardian-Link — ReportForm Component
 * Wrapper for the child report form with header section.
 */

import React from 'react';
import ChildForm from '../children/ChildForm';

const ReportForm = ({ type = 'missing', icon: Icon, onSubmit, loading }) => {
  const config = {
    missing: {
      title: 'Report Missing Child',
      subtitle: 'Please fill in as much detail as possible to help with identification',
      headerTitle: 'Child Information',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    found: {
      title: 'Report Found Child',
      subtitle: 'Provide details about the child you have found to help us match them.',
      headerTitle: 'Found Child Details',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  const c = config[type];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{c.title}</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">{c.headerTitle}</h3>
          <p className="text-sm text-slate-500">{c.subtitle}</p>
        </div>
        <ChildForm type={type} onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default ReportForm;
