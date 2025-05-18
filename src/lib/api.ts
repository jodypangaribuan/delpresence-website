import { API_CONFIG, AUTH_CONFIG, ROUTES } from '../config';
import { ApiOptions, ApiError } from '../interfaces';
import { getAuthToken, getRefreshToken, setAuthData, clearAuthData as clearStorage } from './auth/storage';

/**
 * Secure API fetcher function
 * @param endpoint API endpoint path (without /api prefix)
 * @param options Request options
 * @returns Promise with response data
 */
export async function api<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
  } = options;

  // Build request URL
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Set up headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization if required
  if (requiresAuth) {
    // Get token from storage utility
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required but no token found');
    }
    
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    
    // Check if token has expired
    if (response.status === 401) {
      // Try to refresh token or clear auth on failure
      const refreshSuccess = await refreshAuthToken();
      
      if (refreshSuccess) {
        // Retry the request with new token
        return api(endpoint, options);
      } else {
        // Clear auth data and throw error
        clearAuthData();
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // Parse response
    const data = await response.json();
    
    // Handle API errors
    if (!response.ok) {
      // Extract detailed error information if available
      const errorMsg = data.error || data.message || 'API request failed';
      const errorDetails = data.details || data.errors;
      
      console.error(`API Error (${response.status}):`, {
        url,
        method,
        error: errorMsg,
        details: errorDetails,
        rawResponse: data
      });
      
      // Throw error with more context
      const error = new Error(errorMsg) as ApiError;
      error.status = response.status;
      error.details = errorDetails;
      error.rawResponse = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Attempt to refresh the auth token
 * @returns Promise<boolean> success or failure
 */
async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
      
    if (!refreshToken) {
      return false;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    // Save new tokens using storage utility
    setAuthData(data);
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Clear all auth data from storage and redirect to login
 */
export function clearAuthData() {
  // Use our new storage utility
  clearStorage();
  
  // Redirect to login page if in browser context
  if (typeof window !== 'undefined') {
    window.location.href = ROUTES.LOGIN;
  }
} 