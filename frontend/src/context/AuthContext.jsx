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
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((userData) => {
    setUser(userData);
    setRole(userData.role);
    setToken(localStorage.getItem('token'));
    localStorage.setItem('user_name', userData.full_name || userData.name || '');
    localStorage.setItem('user_email', userData.email || '');
    localStorage.setItem('role', userData.role || 'User');
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('role', tokenData.role);
    localStorage.setItem('user_name', tokenData.user_name);
    localStorage.setItem('user_email', tokenData.email || '');
    setToken(tokenData.access_token);
    setRole(tokenData.role);
    setUser({
      name: tokenData.user_name,
      email: tokenData.email,
      role: tokenData.role,
      email_verified: tokenData.email_verified,
    });
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setRole(null);
    setUser(null);
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
      user, token, role, loading, isAuthenticated, isAdmin, isUser, login, logout,
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
