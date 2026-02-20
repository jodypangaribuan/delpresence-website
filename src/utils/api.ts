import { API_URL, TOKEN_EXPIRY_MS } from './env';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

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
  const url = `${API_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Set up headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization if required
  if (requiresAuth) {
    // Try to get token from different storages in order of preference
    const token = typeof window !== 'undefined'
      ? (window.sessionStorage.getItem('access_token') || window.localStorage.getItem('access_token'))
      : null;

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
      const error = new Error(errorMsg);
      // @ts-ignore - Add additional properties to the error object
      error.status = response.status;
      // @ts-ignore
      error.details = errorDetails;
      // @ts-ignore
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
    const refreshToken = typeof window !== 'undefined'
      ? (window.sessionStorage.getItem('refresh_token') || window.localStorage.getItem('refresh_token'))
      : null;

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
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

    // Save new tokens
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('access_token', data.token);
      window.sessionStorage.setItem('refresh_token', data.refresh_token);
      window.sessionStorage.setItem('token_expiry', (Date.now() + TOKEN_EXPIRY_MS).toString());
      window.sessionStorage.setItem('user', JSON.stringify(data.user));

      // For backward compatibility
      window.localStorage.setItem('access_token', data.token);
      window.localStorage.setItem('refresh_token', data.refresh_token);
      window.localStorage.setItem('token_expiry', (Date.now() + TOKEN_EXPIRY_MS).toString());
      window.localStorage.setItem('user', JSON.stringify(data.user));

      // Update cookie
      document.cookie = `auth_token=${data.token}; max-age=${TOKEN_EXPIRY_MS / 1000}; path=/; SameSite=Strict`;
    }

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Clear all auth data from storage
 */
function clearAuthData() {
  if (typeof window !== 'undefined') {
    // Clear session storage
    window.sessionStorage.removeItem('access_token');
    window.sessionStorage.removeItem('refresh_token');
    window.sessionStorage.removeItem('token_expiry');
    window.sessionStorage.removeItem('user');

    // Clear local storage
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('token_expiry');
    window.localStorage.removeItem('user');

    // Clear cookie
    document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Strict';

    // Redirect to login page
    window.location.href = '/login';
  }
} 