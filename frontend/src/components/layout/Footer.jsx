/**
 * Guardian-Link — Footer Component
 * Simple footer bar shown at the bottom of the main content area.
 */

import React from 'react';
import { Shield } from 'lucide-react';

const Footer = ({ darkMode }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`px-4 lg:px-8 py-4 border-t text-center transition-colors ${
      darkMode
        ? 'bg-slate-900 border-slate-800 text-slate-500'
        : 'bg-white border-slate-200 text-slate-400'
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Guardian-Link © {currentYear}</span>
        </div>
        <p className="text-xs">
          AI-Powered Lost & Found Children Identification System
        </p>
      </div>
    </footer>
  );
};

export default Footer;
