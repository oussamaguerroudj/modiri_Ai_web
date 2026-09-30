import axios from 'axios';

// backend/src/app.js mounts every route under /api, and server.js
// defaults to port 4000 — see backend/.env.example.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const ACCESS_TOKEN_KEY = 'modiri.accessToken';
const REFRESH_TOKEN_KEY = 'modiri.refreshToken';
const USER_KEY = 'modiri.user';

export const tokenStorage = {
  getAccessToken: () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      return !token || token === 'undefined' || token === 'null' ? null : token;
    } catch {
      return null;
    }
  },
  getRefreshToken: () => {
    try {
      const token = localStorage.getItem(REFRESH_TOKEN_KEY);
      return !token || token === 'undefined' || token === 'null' ? null : token;
    } catch {
      return null;
    }
  },
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setSession: ({ user, accessToken, refreshToken }) => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // storage unavailable
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // storage unavailable
    }
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Every error response from the backend has the shape
// { error: true, message, code } (see error.middleware.js) — normalize
// it into a plain Error with .code and .status attached so callers can
// branch on error.code (e.g. 'EMAIL_NOT_VERIFIED', 'INVALID_CREDENTIALS').
function normalizeError(err) {
  const status = err.response?.status;
  const body = err.response?.data;
  const message = body?.message || err.message || 'Something went wrong';
  const normalized = new Error(message);
  normalized.status = status;
  normalized.code = body?.code;
  return normalized;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  // Plain axios call (not apiClient) so this never recurses through the
  // response interceptor below.
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  tokenStorage.setSession(data);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newAccessToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        window.location.assign('/login');
        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export { API_BASE_URL };
