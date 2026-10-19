import { apiRequest } from './api';

export interface Session { id: string; email: string; }

export function login(email: string, password: string) {
  return apiRequest<{ email: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout() {
  return apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function getSession() {
  return apiRequest<Session>('/auth/session');
}
