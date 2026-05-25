/**
 * Guardian-Link — Header Component
 * ──────────────────────────────────
 * Top bar with real user data from AuthContext.
 * Real-time notifications from NotificationContext.
 * Shows user avatar with role-based color.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Menu, Moon, Sun, Bell, Globe, User, Settings, LogOut, Shield, MapPin, Clock, ExternalLink } from 'lucide-react';

const Header = ({ sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode, onLogout }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const dropdownRef = useRef(null);

  const userName = user?.name || localStorage.getItem('user_name') || 'User';
  const userRole = user?.role || localStorage.getItem('role') || 'User';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
        setLangOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/dashboard': 'Dashboard',
      '/report-lost': 'Report Missing',
      '/missing-children': 'Missing Children',
      '/report-found': 'Report Found',
      '/found-children': 'Found Children',
      '/matches': 'AI Matches',
      '/admin': 'Admin Panel',
      '/settings': 'Settings',
    };
    return titles[path] || 'Guardian-Link';
  };

  const handleNotifOpen = () => {
    setNotifOpen(!notifOpen);
    setLangOpen(false);
    setUserMenuOpen(false);
    if (!notifOpen) {
      markAllRead();
    }
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className={`h-16 flex items-center justify-between px-4 lg:px-8 border-b z-30 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-4">
        <button
          className={`lg:hidden p-2 rounded-md ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {getPageTitle()}
        </h1>

        {/* Role Badge */}
        <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
          isAdmin
            ? 'bg-amber-100 text-amber-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {isAdmin && <Shield className="w-3 h-3" />}
          {userRole}
        </span>
      </div>

      <div className="flex items-center gap-2 lg:gap-4" ref={dropdownRef}>
        {/* Public Feed Link */}
        <Link
          to="/public-feed"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            darkMode
              ? 'text-blue-400 hover:bg-blue-900/30'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Public Feed
        </Link>

        {/* Dark Mode Toggle */}
        <button
          className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          onClick={toggleDarkMode}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown — now uses real data */}
        <div className="relative">
          <button
            className={`p-2 rounded-full transition-colors relative ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
            onClick={handleNotifOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {unreadCount === 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Notifications
                </h4>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                  {notifications.length} recent
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div
                      key={n.id || i}
                      className="p-4 border-b border-slate-50 hover:bg-blue-50/50 flex items-start gap-3 cursor-pointer transition-colors group"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate(`/public-feed?highlight=${n.child?.id || ''}`);
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-sm group-hover:bg-red-200 transition-colors">
                        🚨
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium leading-snug">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(n.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <Link
                  to="/public-feed"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                  onClick={() => setNotifOpen(false)}
                >
                  View Public Feed <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Language Dropdown */}
        <div className="relative hidden sm:block">
          <button
            className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserMenuOpen(false); }}
          >
            <Globe className="w-5 h-5" />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setLangOpen(false)}>🇺🇸 English</button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setLangOpen(false)}>🇮🇳 हिन्दी</button>
            </div>
          )}
        </div>

        {/* Profile Menu — shows real user info */}
        <div className="relative">
          <button
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors ml-2"
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setLangOpen(false); }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
              isAdmin
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-700'
            }`}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-green-500'}`} />
                  {userRole}
                </p>
              </div>
              <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <Link to="/public-feed" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                <ExternalLink className="w-4 h-4" /> Public Feed
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
