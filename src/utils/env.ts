/**
 * Environment variables utility
 * 
 * This file centralizes access to all environment variables used in the application.
 * Always use these functions instead of directly accessing process.env to ensure
 * proper fallbacks and type safety.
 */

/**
 * API related environment variables
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Frontend configuration
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Authentication configuration
 */
export const TOKEN_EXPIRY_HOURS = parseInt(process.env.NEXT_PUBLIC_TOKEN_EXPIRY_HOURS || '12', 10);
export const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * CORS Configuration
 */
export const CORS_ALLOWED_ORIGINS = process.env.NEXT_PUBLIC_CORS_ALLOWED_ORIGINS || 'http://localhost:3000';

/**
 * Development configuration
 */
export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * Get all environment variables as an object (for debugging)
 */
export function getAllEnvVars() {
  return {
    API_URL,
    SITE_URL,
    TOKEN_EXPIRY_HOURS,
    CORS_ALLOWED_ORIGINS,
    DEV_MODE
  };
} 