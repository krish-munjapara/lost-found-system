/**
 * Guardian-Link — Missing Children Page
 * Lists all missing children using the ChildCard component.
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import ChildCard from '../components/children/ChildCard';
import { Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { childrenApi } from '../services/api';

const MissingChildren = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const data = await childrenApi.getMissing();
      setChildren(data);
    } catch (err) {
      console.error('Failed to load missing children:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(child =>
    (child.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (child.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          Missing Children
        </h1>
        <Link to="/report-lost" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all text-sm flex items-center gap-2">
          + Report Missing
        </Link>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 mb-8 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text" placeholder="Search by name, location..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-2 pr-4"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
      ) : filteredChildren.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChildren.map((child, idx) => (
            <ChildCard key={child.id || idx} child={child} type="missing" index={idx} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No missing children found</h3>
          <p className="text-sm text-slate-500">We couldn't find any reports matching your criteria.</p>
        </div>
      )}
    </Layout>
  );
};

export default MissingChildren;
