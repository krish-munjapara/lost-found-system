/**
 * Guardian-Link — Layout Wrapper Component
 * ─────────────────────────────────────────
 * Assembles Header + Sidebar + Footer.
 * Uses AuthContext for proper logout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (localStorage.getItem('darkMode') === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        darkMode={darkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-8 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default Layout;
