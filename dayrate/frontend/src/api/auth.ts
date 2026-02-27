import { apiFetch } from './client'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  })
}

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
}

export function refresh() {
  return apiFetch<LoginResponse>('/api/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  })
}

export function logout() {
  return apiFetch<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  })
}
