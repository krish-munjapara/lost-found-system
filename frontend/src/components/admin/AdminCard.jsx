/**
 * Guardian-Link — AdminCard Component
 * Stat card used in the admin dashboard.
 */

import React from 'react';

const AdminCard = ({ title, value, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
    </div>
  );
};

export default AdminCard;
