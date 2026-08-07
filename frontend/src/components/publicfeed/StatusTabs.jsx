/**
 * Guardian-Link — Status Tabs Component
 * Tabs for All Cases, Missing, Found, Reunited
 */

import React from 'react';

const StatusTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: '', label: 'All Cases' },
    { id: 'missing', label: 'Missing' },
    { id: 'found', label: 'Found' },
    { id: 'reunited', label: 'Reunited' }
  ];

  return (
    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-500 hover:text-blue-600'
          }`}
          aria-label={`Show ${tab.label}`}
          aria-pressed={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default StatusTabs;
