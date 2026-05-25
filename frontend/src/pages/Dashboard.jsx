/**
 * Guardian-Link — Dashboard Page (Role-Aware)
 * ─────────────────────────────────────────────
 * ADMIN: Sees system-wide stats (all users, all reports)
 * USER:  Sees only their own reports and stats
 *
 * The backend /api/reports/stats automatically filters
 * by role, so the same API returns different data per role.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ReportCard from '../components/report/ReportCard';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Target, ShieldCheck, Clock, ArrowRight, Shield, FileText } from 'lucide-react';
import { reportsApi } from '../services/api';

const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass }) => (
  <div className={`relative bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-slideUp`}>
    <div className={`absolute top-0 left-0 right-0 h-1 md:h-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${gradientClass}`} />
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 leading-tight">{value}</h3>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const userName = user?.name || localStorage.getItem('user_name') || 'User';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats({
        missing_count: 0,
        found_count: 0,
        match_count: 0,
        pending_count: 0,
        recent_missing: [],
        recent_found: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Welcome Banner — different message per role */}
      <div className={`rounded-2xl p-6 md:p-8 text-white shadow-lg animate-fadeIn relative overflow-hidden ${
        isAdmin
          ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              👋 Welcome back, {userName}!
            </h2>
            {isAdmin && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> ADMIN
              </span>
            )}
          </div>
          <p className={`max-w-2xl leading-relaxed text-sm md:text-base ${isAdmin ? 'text-orange-100' : 'text-blue-100'}`}>
            {isAdmin
              ? 'You have full system access. Monitor all reports, manage users, and review AI matches across the platform.'
              : 'View your submitted reports and AI match results. Report missing or found children to help reunite families.'
            }
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={isAdmin ? 'Total Missing Reports' : 'My Missing Reports'}
          value={stats?.missing_count ?? '—'}
          icon={AlertCircle}
          colorClass="bg-red-100 text-red-600"
          gradientClass="bg-red-500"
        />
        <StatCard
          title={isAdmin ? 'Total Found Children' : 'My Found Reports'}
          value={stats?.found_count ?? '—'}
          icon={ShieldCheck}
          colorClass="bg-blue-100 text-blue-600"
          gradientClass="bg-blue-500"
        />
        <StatCard
          title="AI Matches"
          value={stats?.match_count ?? '—'}
          icon={Target}
          colorClass="bg-green-100 text-green-600"
          gradientClass="bg-green-500"
        />
        <StatCard
          title="Pending"
          value={stats?.pending_count ?? '—'}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600"
          gradientClass="bg-amber-500"
        />
      </div>

      {/* Quick Actions — different per role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/report-lost" className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 text-sm">Report Missing Child</h4>
              <p className="text-xs text-slate-500">Submit a new missing report</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>
        <Link to="/report-found" className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 text-sm">Report Found Child</h4>
              <p className="text-xs text-slate-500">Submit a found report</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>
        {isAdmin ? (
          <Link to="/admin" className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm">Admin Panel</h4>
                <p className="text-xs text-slate-500">Manage users & system</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </Link>
        ) : (
          <Link to="/matches" className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm">View AI Matches</h4>
                <p className="text-xs text-slate-500">See matching results</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {/* Recent Activity Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {isAdmin ? 'Recent Activity (All Users)' : 'My Recent Activity'}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Missing Reports */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {isAdmin ? 'Recent Missing Reports' : 'My Missing Reports'}
              </h4>
              <Link to="/missing-children" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col">
              {stats?.recent_missing?.length > 0 ? (
                stats.recent_missing.slice(0, 3).map((child, i) => (
                  <ReportCard key={child.id || i} report={child} type="missing" />
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {isAdmin ? 'No missing reports yet' : 'You have not submitted any missing reports'}
                </div>
              )}
            </div>
          </div>

          {/* Found Children */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                {isAdmin ? 'Recently Found' : 'My Found Reports'}
              </h4>
              <Link to="/found-children" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col">
              {stats?.recent_found?.length > 0 ? (
                stats.recent_found.slice(0, 3).map((child, i) => (
                  <ReportCard key={child.id || i} report={child} type="found" />
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {isAdmin ? 'No found reports yet' : 'You have not submitted any found reports'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
