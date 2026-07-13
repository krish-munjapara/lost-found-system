/**
 * Guardian-Link — App Routes
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

import Admin from '../pages/Admin';
import Dashboard from '../pages/Dashboard';
import FoundChildren from '../pages/FoundChildren';
import ForgotPassword from '../pages/ForgotPassword';
import Login from '../pages/Login';
import Matches from '../pages/Matches';
import MissingChildren from '../pages/MissingChildren';
import PublicFeed from '../pages/PublicFeed';
import Register from '../pages/Register';
import ReportFound from '../pages/ReportFound';
import ReportLost from '../pages/ReportLost';
import ResetPassword from '../pages/ResetPassword';
import Settings from '../pages/Settings';
import VerifyEmail from '../pages/VerifyEmail';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullScreen message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Loader fullScreen message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Loader fullScreen message="Loading..." />;
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicFeed />} />
    <Route path="/public-feed" element={<PublicFeed />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/missing-children" element={<ProtectedRoute><MissingChildren /></ProtectedRoute>} />
    <Route path="/found-children" element={<ProtectedRoute><FoundChildren /></ProtectedRoute>} />
    <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
    <Route path="/report-lost" element={<ProtectedRoute><ReportLost /></ProtectedRoute>} />
    <Route path="/report-found" element={<ProtectedRoute><ReportFound /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
