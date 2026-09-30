import { apiClient } from './client';

// Mirrors backend/src/modules/auth/auth.routes.js + auth.service.js
// response shapes exactly.

export async function register({ name, email, password }) {
  // -> { email, pendingVerification: true }
  const { data } = await apiClient.post('/auth/register', { name, email, password });
  return data;
}

export async function verifyEmail({ email, code }) {
  // -> { user, accessToken, refreshToken }
  const { data } = await apiClient.post('/auth/verify-email', { email, code });
  return data;
}

export async function resendVerification({ email }) {
  // -> { sent: true }
  const { data } = await apiClient.post('/auth/resend-verification', { email });
  return data;
}

export async function login({ email, password }) {
  // -> { user, accessToken, refreshToken }
  // Throws with error.code === 'EMAIL_NOT_VERIFIED' | 'INVALID_CREDENTIALS'
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function forgotPassword({ email }) {
  // -> { data: { sent: true } }
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword({ email, code, newPassword }) {
  // -> { data: { reset: true } }
  const { data } = await apiClient.post('/auth/reset-password', { email, code, newPassword });
  return data;
}
