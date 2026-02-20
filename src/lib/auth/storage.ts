import { AUTH_CONFIG } from '@/config';
import { AuthResponse } from '@/interfaces';

/**
 * Get the current auth token from storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.getItem !== 'function') return null;
  return window.localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

/**
 * Get the refresh token from storage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.getItem !== 'function') return null;
  return window.localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
}

/**
 * Set auth data in storage
 */
export function setAuthData(data: Partial<AuthResponse>): void {
  if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.setItem !== 'function') return;

  if (data.access_token) {
    window.localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
  }

  if (data.refresh_token) {
    window.localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
  }

  if (data.expires_in) {
    const expiryTime = Date.now() + data.expires_in * 1000;
    window.localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  if (data.user) {
    window.localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));
  }
}

/**
 * Clear all auth data from storage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined' || !window.localStorage || typeof window.localStorage.removeItem !== 'function') return;

  window.localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  window.localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
  window.localStorage.removeItem(AUTH_CONFIG.USER_KEY);
} 