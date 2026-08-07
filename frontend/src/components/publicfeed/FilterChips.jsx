/**
 * Guardian-Link — Filter Chips Component
 * Display active filters with remove functionality
 */

import React from 'react';
import { X } from 'lucide-react';

const FilterChips = ({ filters, onRemove, onClearAll }) => {
  const activeFilters = [];

  // Add status filter
  if (filters.status) {
    activeFilters.push({
      key: 'status',
      label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`
    });
  }

  // Add gender filter
  if (filters.gender) {
    activeFilters.push({
      key: 'gender',
      label: `Gender: ${filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)}`
    });
  }

  // Add age filter
  if (filters.age) {
    activeFilters.push({
      key: 'age',
      label: `Age: ${filters.age}`
    });
  }

  // Add state filter
  if (filters.state) {
    activeFilters.push({
      key: 'state',
      label: `State: ${filters.state}`
    });
  }

  // Add date filter
  if (filters.date) {
    const dateLabels = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month'
    };
    activeFilters.push({
      key: 'date',
      label: `Date: ${dateLabels[filters.date] || filters.date}`
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          aria-label={`Remove ${filter.label} filter`}
        >
          {filter.label}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
      >
        Clear All
      </button>
    </div>
  );
};

export default FilterChips;
