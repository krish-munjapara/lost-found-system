/**
 * Guardian-Link — API Service Layer
 * ──────────────────────────────────
 * Centralized API calls to the FastAPI backend.
 * ALL protected requests include the JWT Authorization header.
 */

const API_BASE = '/api';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Get the JWT token from localStorage */
const getToken = () => localStorage.getItem('token');

/** Build headers with Authorization: Bearer <token> */
const getAuthHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/** Build auth-only header (for FormData — no Content-Type) */
const getAuthOnlyHeaders = () => {
  const token = getToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/** Handle API response — redirect to login on 401 */
const handleResponse = async (res) => {
  if (res.status === 401) {
    // Token expired or invalid — force logout
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (res.status === 403) {
    throw new Error('Access denied: insufficient permissions');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Something went wrong');
  }
  return data;
};

// ──────────────────────────────────────────────
// Auth API  (PUBLIC — no token needed for login/register)
// ──────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  /** Get current user profile using JWT — Authorization header */
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// User API  (PROTECTED — requires JWT)
// ──────────────────────────────────────────────
export const userApi = {
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (updates) => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  getMyReports: async () => {
    const res = await fetch(`${API_BASE}/user/my-reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Get per-user match notifications (targeted alerts) */
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/user/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Mark a single notification as read */
  markNotificationRead: async (notifId) => {
    const res = await fetch(`${API_BASE}/user/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Mark all notifications as read */
  markAllNotificationsRead: async () => {
    const res = await fetch(`${API_BASE}/user/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** Delete a notification */
  deleteNotification: async (notifId) => {
    const res = await fetch(`${API_BASE}/user/notifications/${notifId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// Children API  (PROTECTED — requires JWT)
// ──────────────────────────────────────────────
export const childrenApi = {
  reportLost: async (formData) => {
    const res = await fetch(`${API_BASE}/children/report-lost`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),    // ← FormData: no Content-Type, only Bearer
      body: formData,
    });
    return handleResponse(res);
  },

  reportFound: async (formData) => {
    const res = await fetch(`${API_BASE}/children/report-found`, {
      method: 'POST',
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    return handleResponse(res);
  },

  getMissing: async () => {
    const res = await fetch(`${API_BASE}/children/missing`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getFound: async () => {
    const res = await fetch(`${API_BASE}/children/found`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// Matches API  (PROTECTED — requires JWT)
// ──────────────────────────────────────────────
export const matchesApi = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/matches/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getMatch: async (matchId) => {
    const res = await fetch(`${API_BASE}/matches/${matchId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${API_BASE}/matches/stats/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// Reports / Dashboard API  (PROTECTED — requires JWT)
// ──────────────────────────────────────────────
export const reportsApi = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/reports/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/reports/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// Admin API  (ADMIN ONLY — requires JWT + Admin role)
// Normal users calling these will get 403
// ──────────────────────────────────────────────
export const adminApi = {
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAllUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/all-users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteMissing: async (childId) => {
    const res = await fetch(`${API_BASE}/admin/missing/${childId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteFound: async (childId) => {
    const res = await fetch(`${API_BASE}/admin/found/${childId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  confirmMatch: async (matchId) => {
    const res = await fetch(`${API_BASE}/matches/${matchId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  rejectMatch: async (matchId) => {
    const res = await fetch(`${API_BASE}/matches/${matchId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ──────────────────────────────────────────────
// Public API  (NO AUTH — accessible to everyone)
// Used by the public feed page, social shares, etc.
// ──────────────────────────────────────────────
export const publicApi = {
  /** Get paginated public feed of missing children */
  getFeed: async (page = 1, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE}/public/feed?${params.toString()}`);
    return handlePublicResponse(res);
  },

  /** Get single child detail for sharing */
  getChild: async (childId) => {
    const res = await fetch(`${API_BASE}/public/child/${childId}`);
    return handlePublicResponse(res);
  },

  /** Get public-facing statistics */
  getStats: async () => {
    const res = await fetch(`${API_BASE}/public/stats`);
    return handlePublicResponse(res);
  },

  /** Get recent alerts for notification ticker */
  getRecentAlerts: async () => {
    const res = await fetch(`${API_BASE}/public/recent-alerts`);
    return handlePublicResponse(res);
  },
};

/** Handle public API response (no 401 redirect for public routes) */
const handlePublicResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Something went wrong');
  }
  return data;
};

// ──────────────────────────────────────────────
// Social Sharing Helpers
// ──────────────────────────────────────────────
export const shareUtils = {
  /** Generate a share URL for a missing child report */
  getShareUrl: (childId) => {
    return `${window.location.origin}/public-feed?highlight=${childId}`;
  },

  /** Share via WhatsApp */
  shareWhatsApp: (child) => {
    const text = `🚨 MISSING CHILD ALERT\n\nName: ${child.name}\nAge: ${child.age} years\nLast Seen: ${child.location}\n\nPlease help find this child! Share this information.\n\n${shareUtils.getShareUrl(child.id)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  },

  /** Share via Facebook */
  shareFacebook: (child) => {
    const url = shareUtils.getShareUrl(child.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`🚨 Missing Child: ${child.name}, Age ${child.age} - Last seen at ${child.location}`)}`, '_blank');
  },

  /** Share via Twitter/X */
  shareTwitter: (child) => {
    const text = `🚨 MISSING CHILD ALERT: ${child.name}, Age ${child.age}, Last seen at ${child.location}. Please help! #MissingChild #GuardianLink`;
    const url = shareUtils.getShareUrl(child.id);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  },

  /** Copy link to clipboard */
  copyLink: async (child) => {
    const url = shareUtils.getShareUrl(child.id);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return true;
    }
  },

  /** Share via Email */
  shareEmail: (child) => {
    const subject = `🚨 Missing Child Alert: ${child.name}`;
    const body = `MISSING CHILD ALERT\n\nName: ${child.name}\nAge: ${child.age} years\nGender: ${child.gender}\nLast Seen: ${child.location}\nDescription: ${child.description || 'N/A'}\n\nPlease help find this child by sharing this information.\n\nView full details: ${shareUtils.getShareUrl(child.id)}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  },
};
