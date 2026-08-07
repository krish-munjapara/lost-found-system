/**
 * Guardian-Link — Public Feed Toolbar Component
 * Search input, filter dropdowns, and sort dropdown
 */

import React from 'react';
import { Filter } from 'lucide-react';
import SearchBar from './SearchBar';
import SortDropdown from './SortDropdown';

const PublicFeedToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  onFilterClick, 
  sortValue, 
  onSortChange,
  filters,
  onFilterChange,
  availableStates,
  showFilterButton = true 
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Left - Search Input */}
        <div className="flex-1 w-full lg:w-auto">
          <SearchBar 
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search reports..."
          />
        </div>

        {/* Center - Filter Dropdowns (Desktop) */}
        <div className="hidden lg:flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          >
            <option value="">All Status</option>
            <option value="missing">Missing</option>
            <option value="found">Found</option>
            <option value="reunited">Reunited</option>
          </select>

          {/* Gender Filter */}
          <select
            value={filters.gender}
            onChange={(e) => onFilterChange('gender', e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Age Filter */}
          <select
            value={filters.age}
            onChange={(e) => onFilterChange('age', e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          >
            <option value="">All Ages</option>
            <option value="0-5">0-5</option>
            <option value="6-10">6-10</option>
            <option value="11-15">11-15</option>
            <option value="16-18">16-18</option>
          </select>

          {/* State Filter */}
          <select
            value={filters.state}
            onChange={(e) => onFilterChange('state', e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          >
            <option value="">All States</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Filter Button */}
        {showFilterButton && (
          <button
            onClick={onFilterClick}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all text-sm font-medium lg:hidden"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        )}

        {/* Right - Sort Dropdown */}
        <SortDropdown value={sortValue} onChange={onSortChange} />
      </div>
    </div>
  );
};

export default PublicFeedToolbar;
