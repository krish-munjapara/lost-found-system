/**
 * Guardian-Link — Public Feed Header Component
 * Section header with title and subtitle
 */

import React from 'react';

const PublicFeedHeader = () => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
        Public Feed
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        Browse verified missing, found and reunited child reports shared through Guardian Link.
      </p>
    </div>
  );
};

export default PublicFeedHeader;
