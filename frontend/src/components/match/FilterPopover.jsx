/**
 * Guardian-Link — FilterPopover Component
 * Dropdown filter control for Matches page
 */

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

const FilterPopover = ({ 
  reportTypeFilter, 
  statusFilter, 
  onReportTypeChange, 
  onStatusChange,
  onClear,
  isAdmin 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const activeFilterCount = 
    (reportTypeFilter !== 'All' ? 1 : 0) + 
    (statusFilter !== 'All' ? 1 : 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClear = () => {
    onReportTypeChange('All');
    onStatusChange('All');
    setIsOpen(false);
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const reportTypeOptions = isAdmin 
    ? [] 
    : ['All', 'My Missing Reports', 'My Found Reports'];

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Rejected'];

  return (
    <div className="relative" ref={popoverRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filter</span>
        {activeFilterCount > 0 && (
          <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filter Matches</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Report Type Filter */}
            {!isAdmin && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Report Type</label>
                <div className="space-y-1">
                  {reportTypeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => onReportTypeChange(option)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reportTypeFilter === option
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {reportTypeFilter === option && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      )}
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
              <div className="space-y-1">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => onStatusChange(option)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === option
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {statusFilter === option && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    )}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;
