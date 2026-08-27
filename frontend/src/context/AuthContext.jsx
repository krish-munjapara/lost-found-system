/**
 * Guardian-Link — Auth Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearAuth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [profileComplete, setProfileComplete] = useState(localStorage.getItem('profile_complete') === 'true');
  const [mobileVerified, setMobileVerified] = useState(localStorage.getItem('mobile_verified') === 'true');
  const [pendingProfileCompletion, setPendingProfileCompletion] = useState(false);
  const [pendingToken, setPendingToken] = useState(sessionStorage.getItem('pending_token') || null);
  const [pendingGoogleData, setPendingGoogleData] = useState(
    sessionStorage.getItem('pending_google_data') ? JSON.parse(sessionStorage.getItem('pending_google_data')) : null
  );
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((userData) => {
    setUser(userData);
    setRole(userData.role);
    setToken(localStorage.getItem('token'));
    setProfileComplete(userData.profile_complete !== false);
    setMobileVerified(userData.mobile_verified !== false);
    localStorage.setItem('user_name', userData.full_name || userData.name || '');
    localStorage.setItem('user_email', userData.email || '');
    localStorage.setItem('role', userData.role || 'User');
    localStorage.setItem('profile_complete', userData.profile_complete !== false ? 'true' : 'false');
    localStorage.setItem('mobile_verified', userData.mobile_verified !== false ? 'true' : 'false');
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('role', tokenData.role);
    localStorage.setItem('user_name', tokenData.user_name);
    localStorage.setItem('user_email', tokenData.email || '');
    localStorage.setItem('profile_complete', tokenData.profile_complete !== false ? 'true' : 'false');
    localStorage.setItem('mobile_verified', tokenData.mobile_verified !== false ? 'true' : 'false');
    setToken(tokenData.access_token);
    setRole(tokenData.role);
    setProfileComplete(tokenData.profile_complete !== false);
    setMobileVerified(tokenData.mobile_verified !== false);
    setUser({
      name: tokenData.user_name,
      email: tokenData.email,
      role: tokenData.role,
      email_verified: tokenData.email_verified,
      profile_complete: tokenData.profile_complete !== false,
      mobile_verified: tokenData.mobile_verified !== false,
    });
  };

  const setPendingSignup = (pendingData) => {
    setPendingProfileCompletion(true);
    setPendingToken(pendingData.pending_token);
    setPendingGoogleData({
      google_email: pendingData.google_email,
      google_name: pendingData.google_name,
      google_picture: pendingData.google_picture,
    });
    sessionStorage.setItem('pending_token', pendingData.pending_token);
    sessionStorage.setItem('pending_google_data', JSON.stringify({
      google_email: pendingData.google_email,
      google_name: pendingData.google_name,
      google_picture: pendingData.google_picture,
    }));
  };

  const clearPendingSignup = () => {
    setPendingProfileCompletion(false);
    setPendingToken(null);
    setPendingGoogleData(null);
    sessionStorage.removeItem('pending_token');
    sessionStorage.removeItem('pending_google_data');
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setRole(null);
    setProfileComplete(false);
    setMobileVerified(false);
    setUser(null);
    clearPendingSignup();
    // Clear all auth-related localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('profile_complete');
    localStorage.removeItem('mobile_verified');
  };

  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.getMe();
        if (data?.user) applyUser(data.user);
      } catch {
        clearAuth();
        setToken(null);
        setRole(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, [applyUser]);

  const isAuthenticated = !!token;
  const isAdmin = role === 'Admin';
  const isUser = role === 'User';

  return (
    <AuthContext.Provider value={{
      user, token, role, loading, isAuthenticated, isAdmin, isUser, login, logout, profileComplete, mobileVerified, applyUser,
      pendingProfileCompletion, pendingToken, pendingGoogleData, setPendingSignup, clearPendingSignup,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
