/**
 * Guardian-Link — App Routes with Protected Route Guards
 * ──────────────────────────────────────────────────────
 * - PublicFeed: Accessible to everyone (no login required)
 * - ProtectedRoute: Requires authentication (any role)
 * - AdminRoute: Requires authentication + Admin role
 * - Public routes: Login, Register (redirect to dashboard if already logged in)
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Admin from '../pages/Admin';
import Dashboard from '../pages/Dashboard';
import FoundChildren from '../pages/FoundChildren';
import Login from '../pages/Login';
import Matches from '../pages/Matches';
import MissingChildren from '../pages/MissingChildren';
import PublicFeed from '../pages/PublicFeed';
import Register from '../pages/Register';
import ReportFound from '../pages/ReportFound';
import ReportLost from '../pages/ReportLost';
import Settings from '../pages/Settings';

// ──────────────────────────────────────────────
// ProtectedRoute — requires login (any role)
// ──────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ──────────────────────────────────────────────
// AdminRoute — requires login + Admin role
// ──────────────────────────────────────────────
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Normal user trying to access admin page → redirect to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ──────────────────────────────────────────────
// PublicRoute — redirect to dashboard if already logged in
// ──────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    // Admin goes to admin page, User goes to dashboard
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

// ──────────────────────────────────────────────
// Route Definitions
// ──────────────────────────────────────────────
const AppRoutes = () => {
  return (
    <Routes>
      {/* ★ Public Feed — accessible to ALL visitors (no login) */}
      <Route path="/" element={<PublicFeed />} />
      <Route path="/public-feed" element={<PublicFeed />} />

      {/* Auth Routes — redirect if already logged in */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected Routes — any authenticated user */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/missing-children" element={<ProtectedRoute><MissingChildren /></ProtectedRoute>} />
      <Route path="/found-children" element={<ProtectedRoute><FoundChildren /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/report-lost" element={<ProtectedRoute><ReportLost /></ProtectedRoute>} />
      <Route path="/report-found" element={<ProtectedRoute><ReportFound /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Admin-Only Route — requires Admin role */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Catch-all → redirect to public feed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
