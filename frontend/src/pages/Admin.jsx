/**
 * Guardian-Link — Admin Page
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import AdminCard from '../components/admin/AdminCard';
import AdminTable from '../components/admin/AdminTable';
import Loader from '../components/common/Loader';
import { Shield, Users, Database, Server, Activity, Trash2, CheckCircle } from 'lucide-react';
import { adminApi } from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getDashboard();
      setData(result);
      const logData = await adminApi.getAuditLogs(30);
      setLogs(logData.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user and all their reports?')) return;
    await adminApi.deleteUser(userId);
    loadDashboard();
  };

  const handleDeleteMissing = async (id) => {
    if (!confirm('Delete this missing report?')) return;
    await adminApi.deleteMissing(id);
    loadDashboard();
  };

  const handleDeleteFound = async (id) => {
    if (!confirm('Delete this found report?')) return;
    await adminApi.deleteFound(id);
    loadDashboard();
  };

  const handleResolve = async (id) => {
    await adminApi.resolveMissing(id);
    loadDashboard();
  };

  if (loading) return <Layout><Loader message="Loading admin panel..." /></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 dark:text-white">
          <Shield className="w-8 h-8 text-indigo-600" /> Admin Panel
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AdminCard title="Users" value={data?.user_count ?? '—'} icon={Users} colorClass="bg-blue-100 text-blue-600" />
        <AdminCard title="Missing" value={data?.missing_count ?? '—'} icon={Database} colorClass="bg-red-100 text-red-600" />
        <AdminCard title="Found" value={data?.found_count ?? '—'} icon={Server} colorClass="bg-green-100 text-green-600" />
        <AdminCard title="Pending Matches" value={data?.pending_matches ?? '—'} icon={Activity} colorClass="bg-amber-100 text-amber-600" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-2">
          {['users', 'reports', 'logs'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
              {tab === 'reports' ? 'Report Management' : tab === 'logs' ? 'Audit Logs' : 'User Management'}
            </button>
          ))}
        </div>

        <div className="p-0">
          {activeTab === 'users' && <AdminTable users={data?.users || []} onDelete={handleDeleteUser} />}

          {activeTab === 'reports' && (
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold mb-3 dark:text-white">Missing Reports</h4>
                <div className="space-y-2">
                  {(data?.missing_children || []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                      <span className="dark:text-white">{c.name} — {c.location} <span className="text-slate-400">({c.status})</span></span>
                      <div className="flex gap-2">
                        {c.status !== 'Resolved' && (
                          <button onClick={() => handleResolve(c.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Resolved"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleDeleteMissing(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 dark:text-white">Found Reports</h4>
                <div className="space-y-2">
                  {(data?.found_children || []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                      <span className="dark:text-white">{c.name || 'Unknown'} — {c.location}</span>
                      <button onClick={() => handleDeleteFound(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? <p className="text-slate-500 text-sm">No audit logs yet</p> : logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-xs dark:text-slate-200">
                  <span className="font-semibold">{log.action}</span> by {log.actor_email} on {log.resource_type}
                  {log.resource_id && ` #${log.resource_id}`}
                  <span className="text-slate-400 ml-2">{log.created_at && new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
