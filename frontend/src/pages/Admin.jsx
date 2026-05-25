/**
 * Guardian-Link — Admin Page
 * Admin dashboard using AdminCard and AdminTable components.
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import AdminCard from '../components/admin/AdminCard';
import AdminTable from '../components/admin/AdminTable';
import { Shield, Users, Database, Server, Activity, Settings as SettingsIcon } from 'lucide-react';
import { adminApi } from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await adminApi.getDashboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          Admin Panel
        </h1>
        <p className="text-slate-500 text-sm">System administration, user management, and system logs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminCard title="Total Users" value={data?.user_count ?? '—'} icon={Users} colorClass="bg-blue-100 text-blue-600" />
        <AdminCard title="Missing Reports" value={data?.missing_count ?? '—'} icon={Database} colorClass="bg-green-100 text-green-600" />
        <AdminCard title="AI Matches" value={data?.match_count ?? '—'} icon={Server} colorClass="bg-amber-100 text-amber-600" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex items-center border-b border-slate-100 px-2 pt-2 bg-slate-50/50">
          {[
            { key: 'users', label: 'User Management' },
            { key: 'logs', label: 'System Logs' },
            { key: 'settings', label: 'App Configurations' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0 flex-1 overflow-x-auto">
          {activeTab === 'users' && (
            loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
              </div>
            ) : (
              <AdminTable users={data?.users || []} onDelete={handleDeleteUser} />
            )
          )}

          {activeTab === 'logs' && (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full text-slate-500">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <p>System logs will appear here</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full text-slate-500">
              <SettingsIcon className="w-12 h-12 text-slate-300 mb-4" />
              <p>Global app settings will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
