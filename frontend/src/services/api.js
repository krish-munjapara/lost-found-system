/**
 * Guardian-Link — API Service Layer
 */

import { buildRegisterPayload, validateRegisterPayload } from '../utils/registerValidation';

const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const storeAuth = (data) => {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('user_name', data.user_name);
  localStorage.setItem('user_email', data.email || '');
  localStorage.setItem('email_verified', String(data.email_verified ?? false));
};

const clearAuth = () => {
  ['token', 'refresh_token', 'role', 'user_name', 'user_email', 'email_verified'].forEach(
    (k) => localStorage.removeItem(k)
  );
};

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const getAuthOnlyHeaders = () => {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

let refreshPromise = null;

/**
 * Parse FastAPI / API error payloads into a readable string.
 * Handles 422 validation arrays, string details, and nested objects.
 */
export const parseApiError = (data, fallback = 'Something went wrong') => {
  if (!data) return fallback;

  const detail = data.detail ?? data.message;

  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return String(item);
        const field = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : '';
        const msg = item.msg || item.message || fallback;
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }

  if (typeof detail === 'object') {
    return detail.msg || detail.message || fallback;
  }

  return String(detail);
};

const tryRefreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        storeAuth(data);
        return true;
      })
      .catch(() => false)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const handleResponse = async (res, retried = false) => {
  console.log('handleResponse - Status:', res.status, 'URL:', res.url);
  if (res.status === 401 && !retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return null;
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (res.status === 403) throw new Error('Access denied: insufficient permissions');
  const data = await res.json();
  console.log('handleResponse - Parsed JSON:', data);
  if (!res.ok) throw new Error(parseApiError(data));
  return data;
};

const authFetch = async (url, options = {}, retried = false) => {
  const res = await fetch(url, options);
  if (res.status === 401 && !retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const headers = { ...options.headers, Authorization: `Bearer ${getToken()}` };
      return authFetch(url, { ...options, headers }, true);
    }
  }
  return handleResponse(res, retried);
};

export const getImageUrl = (image, folder = 'lost', imageUrl = null) => {
  if (imageUrl && imageUrl.startsWith('http')) return imageUrl;
  if (!image) return null;
  return `/uploads/${folder}/${image}`;
};

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    storeAuth(data);
    return data;
  },

  register: async (userData) => {
    const payload = buildRegisterPayload(userData);
    const validationError = validateRegisterPayload(payload);
    if (validationError) {
      throw new Error(validationError);
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getMe: async () => authFetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() }),

  logout: async () => {
    const refresh = getRefreshToken();
    if (refresh && getToken()) {
      try {
        await authFetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ refresh_token: refresh }),
        });
      } catch { /* ignore */ }
    }
    clearAuth();
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (token, new_password) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
    });
    return handleResponse(res);
  },

  verifyEmail: async (token) => {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    });
    return handleResponse(res);
  },

  resendVerification: async () =>
    authFetch(`${API_BASE}/auth/resend-verification`, { method: 'POST', headers: getAuthHeaders() }),
};

export const userApi = {
  getProfile: () => authFetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() }),
  updateProfile: (updates) =>
    authFetch(`${API_BASE}/user/profile`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
    }),
  changePassword: (current_password, new_password) =>
    authFetch(`${API_BASE}/user/change-password`, {
      method: 'PUT', headers: getAuthHeaders(),
      body: JSON.stringify({ current_password, new_password }),
    }),
  getPreferences: () => authFetch(`${API_BASE}/user/preferences`, { headers: getAuthHeaders() }),
  updatePreferences: (prefs) =>
    authFetch(`${API_BASE}/user/preferences`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(prefs),
    }),
  deleteAccount: () =>
    authFetch(`${API_BASE}/user/account`, { method: 'DELETE', headers: getAuthHeaders() }),
  getMyReports: () => authFetch(`${API_BASE}/user/my-reports`, { headers: getAuthHeaders() }),
  getNotifications: () => authFetch(`${API_BASE}/user/notifications`, { headers: getAuthHeaders() }),
  markNotificationRead: (id) =>
    authFetch(`${API_BASE}/user/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() }),
  markAllNotificationsRead: () =>
    authFetch(`${API_BASE}/user/notifications/read-all`, { method: 'PUT', headers: getAuthHeaders() }),
  deleteNotification: (id) =>
    authFetch(`${API_BASE}/user/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
};

export const childrenApi = {
  reportLost: (formData) =>
    authFetch(`${API_BASE}/children/report-lost`, {
      method: 'POST', headers: getAuthOnlyHeaders(), body: formData,
    }),
  reportFound: (formData) =>
    authFetch(`${API_BASE}/children/report-found`, {
      method: 'POST', headers: getAuthOnlyHeaders(), body: formData,
    }),
  getMissing: () => authFetch(`${API_BASE}/children/missing`, { headers: getAuthHeaders() }),
  getFound: () => authFetch(`${API_BASE}/children/found`, { headers: getAuthHeaders() }),
};

export const matchesApi = {
  getAll: async () => {
    console.log('API Call: GET /api/matches/');
    const result = await authFetch(`${API_BASE}/matches/`, { headers: getAuthHeaders() });
    console.log('API Raw Result:', result);
    console.log('Result Type:', typeof result);
    console.log('Is Array:', Array.isArray(result));
    return result;
  },
  getMatch: (id) => authFetch(`${API_BASE}/matches/${id}`, { headers: getAuthHeaders() }),
  getStats: () => authFetch(`${API_BASE}/matches/stats/summary`, { headers: getAuthHeaders() }),
};

export const reportsApi = {
  getStats: () => authFetch(`${API_BASE}/reports/stats`, { headers: getAuthHeaders() }),
};

export const adminApi = {
  getDashboard: () => authFetch(`${API_BASE}/admin/dashboard`, { headers: getAuthHeaders() }),
  getAllUsers: () => authFetch(`${API_BASE}/admin/all-users`, { headers: getAuthHeaders() }),
  getAuditLogs: (limit = 50) =>
    authFetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, { headers: getAuthHeaders() }),
  deleteUser: (id) =>
    authFetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
  deleteMissing: (id) =>
    authFetch(`${API_BASE}/admin/missing/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
  deleteFound: (id) =>
    authFetch(`${API_BASE}/admin/found/${id}`, { method: 'DELETE', headers: getAuthHeaders() }),
  resolveMissing: (id) =>
    authFetch(`${API_BASE}/admin/missing/${id}/resolve`, { method: 'PUT', headers: getAuthHeaders() }),
  confirmMatch: (id) =>
    authFetch(`${API_BASE}/matches/${id}/confirm`, { method: 'PUT', headers: getAuthHeaders() }),
  rejectMatch: (id) =>
    authFetch(`${API_BASE}/matches/${id}/reject`, { method: 'PUT', headers: getAuthHeaders() }),
};

export const publicApi = {
  getFeed: async (page = 1, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE}/public/feed?${params}`);
    return handleResponse(res, true);
  },
  getChild: async (id) => handleResponse(await fetch(`${API_BASE}/public/child/${id}`), true),
  getStats: async () => handleResponse(await fetch(`${API_BASE}/public/stats`), true),
  getRecentAlerts: async () => handleResponse(await fetch(`${API_BASE}/public/recent-alerts`), true),
};

export const shareUtils = {
  getShareUrl: (childId) => `${window.location.origin}/public-feed?highlight=${childId}`,
  shareWhatsApp: (child) => {
    const text = `🚨 MISSING CHILD: ${child.name}, Age ${child.age} — ${child.location}\n${shareUtils.getShareUrl(child.id)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  },
  shareFacebook: (child) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUtils.getShareUrl(child.id))}`, '_blank');
  },
  shareTwitter: (child) => {
    const text = `🚨 MISSING CHILD: ${child.name}, Age ${child.age} — ${child.location}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUtils.getShareUrl(child.id))}`, '_blank');
  },
  copyLink: async (child) => {
    await navigator.clipboard.writeText(shareUtils.getShareUrl(child.id));
    return true;
  },
  shareEmail: (child) => {
    const subject = `Missing Child Alert: ${child.name}`;
    const body = `Name: ${child.name}\nAge: ${child.age}\nLocation: ${child.location}\n\n${shareUtils.getShareUrl(child.id)}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  },
};

export { storeAuth, clearAuth };
