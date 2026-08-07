/**
 * Guardian-Link — Report Grid Component
 * Responsive grid for report cards
 */

import React from 'react';

const ReportGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
};

export default ReportGrid;
