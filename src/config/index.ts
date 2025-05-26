// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  API_PREFIX: '/api/v1',
  TIMEOUT: 30000,
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY_KEY: 'token_expiry',
  USER_KEY: 'user',
  EXPIRY_BUFFER: 60000, // 1 minute buffer before token expiry
};

// Route Configuration
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  UNAUTHORIZED: '/unauthorized',
};

export default {
  API_CONFIG,
  AUTH_CONFIG,
  ROUTES,
}; 