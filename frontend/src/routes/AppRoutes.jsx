/**
 * Guardian-Link — App Routes
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

import Admin from '../pages/Admin';
import Dashboard from '../pages/Dashboard';
import FoundChildren from '../pages/FoundChildren';
import ForgotPassword from '../pages/ForgotPassword';
import Home from '../pages/Home';
import IntelligenceMap from '../pages/IntelligenceMap';
import Login from '../pages/Login';
import Matches from '../pages/Matches';
import MissingChildren from '../pages/MissingChildren';
import News from '../pages/News';
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

const routeTitles = {
  '/': 'Home',
  '/news': 'News',
  '/intelligence-map': 'Intelligence Map',
  '/login': 'Login',
  '/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/verify-email': 'Verify Email',
  '/dashboard': 'Dashboard',
  '/missing-children': 'Missing Children',
  '/found-children': 'Found Children',
  '/matches': 'Matches',
  '/report-lost': 'Report Lost',
  '/report-found': 'Report Found',
  '/settings': 'Settings',
  '/admin': 'Admin',
};

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    const titleKey = routeTitles[location.pathname] || 'Home';
    document.title = `${titleKey} | Guardian-Link`;
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/news" element={<News />} />
      <Route path="/intelligence-map" element={<IntelligenceMap />} />
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
};

export default AppRoutes;
