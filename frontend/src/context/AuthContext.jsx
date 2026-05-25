/**
 * Guardian-Link — Auth Context
 * ──────────────────────────────
 * Global authentication state management.
 * Stores JWT token, user role, and user info.
 * Provides login/logout functions and role-check helpers.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [loading, setLoading] = useState(true);

  /**
   * Login — saves token, role, name, email to localStorage + state.
   * Called from Login page after successful API response.
   */
  const login = (tokenData) => {
    localStorage.setItem('token', tokenData.access_token);
    localStorage.setItem('role', tokenData.role);
    localStorage.setItem('user_name', tokenData.user_name);
    setToken(tokenData.access_token);
    setRole(tokenData.role);
    setUser({
      name: tokenData.user_name,
      role: tokenData.role,
    });
  };

  /**
   * Logout — clears all stored auth data and redirects to login.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  // Derived state
  const isAuthenticated = !!token;
  const isAdmin = role === 'Admin';
  const isUser = role === 'User';

  /**
   * On mount — restore session from localStorage.
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedName = localStorage.getItem('user_name');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedName) {
      setUser({
        name: savedName,
        role: savedRole,
      });
      setToken(savedToken);
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      loading,
      isAuthenticated,
      isAdmin,
      isUser,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
