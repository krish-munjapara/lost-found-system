/**
 * Guardian-Link — Root Application Component
 * Wraps the app with AuthProvider, NotificationProvider, and Router.
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import ToastNotifications from './components/common/ToastNotifications';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
          <ToastNotifications />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
