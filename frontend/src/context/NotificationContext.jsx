/**
 * Guardian-Link — Notification Context
 * ──────────────────────────────────────
 * Global notification system with:
 * - Real-time polling for public alerts & user notifications
 * - Toast notification display
 * - Notification history & badge count
 * - Browser Notification API integration
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { publicApi, userApi } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // Poll every 30 seconds

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();
  
  const lastCheckRef = useRef(null);
  const toastIdRef = useRef(0);

  /** Request browser notification permission */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /** Add a toast notification (auto-dismiss after 6s) */
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    const toast = { id, message, type, timestamp: new Date() };
    setToasts(prev => [toast, ...prev].slice(0, 5)); // Keep max 5 toasts

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);

    return id;
  }, []);

  /** Remove a specific toast */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /** Send a browser notification */
  const sendBrowserNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'guardian-link-alert',
      });
    }
  }, []);

  /** Poll for new alerts & user notifications */
  const checkForNewAlerts = useCallback(async () => {
    try {
      if (isAuthenticated) {
        // Poll targeted notifications for logged-in user
        const userData = await userApi.getNotifications();
        if (userData && userData.success) {
          
          if (lastCheckRef.current) {
            const newNotifs = userData.notifications.filter(n => {
              const notifTime = new Date(n.created_at);
              return notifTime > lastCheckRef.current;
            });

            newNotifs.forEach(n => {
              addToast(
                n.title ? `${n.title}: ${n.message}` : n.message,
                n.type.includes('match') ? 'success' : 'alert'
              );
              sendBrowserNotification(
                n.title || 'Guardian-Link Update',
                n.message
              );
            });
          }

          setNotifications(userData.notifications.map(n => ({
            id: n._id ? n._id.toString() : Math.random().toString(),
            message: n.message,
            title: n.title,
            time: n.created_at,
            type: n.type,
            child: { 
              name: n.missing_child_name || n.found_child_name || '', 
              image: n.missing_image || n.found_image || '' 
            },
            isRead: n.read,
            matchId: n.match_id
          })));
          
          setUnreadCount(userData.unread_count || 0);
        }
      } else {
        // Poll public alerts for guests
        const alerts = await publicApi.getRecentAlerts();

        if (lastCheckRef.current) {
          const newAlerts = alerts.filter(alert => {
            const alertTime = new Date(alert.created_at);
            return alertTime > lastCheckRef.current;
          });

          newAlerts.forEach(alert => {
            addToast(
              `🚨 New Missing Child Alert: ${alert.name}, Age ${alert.age} — Last seen at ${alert.location}`,
              'alert'
            );
            sendBrowserNotification(
              '🚨 Missing Child Alert',
              `${alert.name}, Age ${alert.age} — Last seen at ${alert.location}`
            );
          });
          
          setUnreadCount(prev => prev + newAlerts.length);
        }

        setNotifications(alerts.map(a => ({
          id: a.id,
          message: `Missing: ${a.name}, Age ${a.age} — ${a.location}`,
          time: a.created_at,
          type: 'alert',
          child: a,
        })));
      }

      lastCheckRef.current = new Date();
    } catch (err) {
      console.error('Failed to check for alerts/notifications:', err);
    }
  }, [isAuthenticated, addToast, sendBrowserNotification]);

  /** Start polling when component mounts or auth changes */
  useEffect(() => {
    checkForNewAlerts(); // Initial check
    const interval = setInterval(checkForNewAlerts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForNewAlerts]);

  /** Mark all as read */
  const markAllRead = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await userApi.markAllNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error('Error marking all as read', err);
      }
    }
    setUnreadCount(0);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      toasts,
      unreadCount,
      addToast,
      removeToast,
      markAllRead,
      checkForNewAlerts,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
