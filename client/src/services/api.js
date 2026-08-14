// src/services/api.js
// Centralised Axios instance — all API calls go through here.
// Clerk session token is automatically attached via interceptor.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Token getter — set by ClerkTokenProvider after Clerk loads
let _getToken = null;
export const setTokenGetter = (fn) => { _getToken = fn; };

// Request interceptor — attaches Clerk session token to every request
api.interceptors.request.use(async (config) => {
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // no token — request goes unauthenticated
    }
  }
  return config;
});

// Response interceptor — unwrap .data so callers get payload directly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  sync: () => api.post('/auth/sync'),
  me: () => api.get('/auth/me'),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: (id) => api.get(`/students/${id}/stats`),
};

// ── Problems ──────────────────────────────────────────────────────────────────
export const problemsApi = {
  getByDate: (date, studentId) => api.get(`/problems?date=${date}${studentId ? `&studentId=${studentId}` : ''}`),
  getById: (id) => api.get(`/problems/${id}`),
  create: (data) => api.post('/problems', data),
  complete: (id, studentId) => api.patch(`/problems/${id}/complete`, { studentId }),
  saveProgress: (id, studentId, note) => api.patch(`/problems/${id}/progress`, { studentId, note }),
  delete: (id) => api.delete(`/problems/${id}`),
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const leaderboardApi = {
  get: () => api.get('/leaderboard'),
};

// ── Config ────────────────────────────────────────────────────────────────────
export const configApi = {
  getScoringConfig: () => api.get('/config/scoring'),
  updateScoringConfig: (data) => api.put('/config/scoring', data),
};

export default api;
