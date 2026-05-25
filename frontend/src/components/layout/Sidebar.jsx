/**
 * Guardian-Link — Sidebar Component
 * ─────────────────────────────────
 * Role-aware navigation sidebar.
 * - Admin Panel link is HIDDEN for normal users.
 * - User info section shows real name and role.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, LayoutDashboard, FileText, AlertCircle,
  MapPin, ShieldAlert, Cpu, Settings, ExternalLink
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, badge, active, darkMode }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : `${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
    <span className="flex-1">{label}</span>
    {badge && (
      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

const Sidebar = ({ open, setOpen, darkMode }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const userName = user?.name || localStorage.getItem('user_name') || 'User';
  const userRole = user?.role || localStorage.getItem('role') || 'User';

  // ─── Build menu sections based on role ───
  const menuSections = [
    {
      title: 'Main',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/public-feed', icon: ExternalLink, label: 'Public Feed' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { to: '/report-lost', icon: FileText, label: 'Report Missing' },
        { to: '/missing-children', icon: AlertCircle, label: 'Missing Children' },
        { to: '/report-found', icon: MapPin, label: 'Report Found' },
        { to: '/found-children', icon: ShieldAlert, label: 'Found Children' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { to: '/matches', icon: Cpu, label: 'AI Matches' },
      ]
    },
  ];

  // ─── ADMIN ONLY: Show System section ───
  if (isAdmin) {
    menuSections.push({
      title: 'System',
      items: [
        { to: '/admin', icon: Shield, label: 'Admin Panel' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ]
    });
  } else {
    // Normal User only sees Settings (no Admin Panel)
    menuSections.push({
      title: 'Account',
      items: [
        { to: '/settings', icon: Settings, label: 'Settings' },
      ]
    });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r shadow-xl lg:shadow-none lg:static lg:block transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex flex-col`}>

        {/* Logo */}
        <div className={`h-16 flex items-center px-6 gap-3 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className={`font-bold text-sm tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Guardian-Link
            <span className={`block text-[10px] font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Child Safety System
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {menuSections.map((section) => (
            <div key={section.title}>
              <div className={`px-4 text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.to}
                    {...item}
                    active={location.pathname === item.to}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info — shows real name + role */}
        <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
              isAdmin
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-700'
            }`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {userName}
              </div>
              <div className={`text-xs truncate flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-green-500'}`} />
                {userRole}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
