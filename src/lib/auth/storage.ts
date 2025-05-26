import { AUTH_CONFIG } from '@/config';
import { AuthResponse } from '@/interfaces';

/**
 * Get the current auth token from storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

/**
 * Get the refresh token from storage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
}

/**
 * Set auth data in storage
 */
export function setAuthData(data: Partial<AuthResponse>): void {
  if (typeof window === 'undefined') return;
  
  if (data.access_token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
  }
  
  if (data.refresh_token) {
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
  }
  
  if (data.expires_in) {
    const expiryTime = Date.now() + data.expires_in * 1000;
    localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  
  if (data.user) {
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));
  }
}

/**
 * Clear all auth data from storage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
} 