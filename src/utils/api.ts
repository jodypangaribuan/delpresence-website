type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
      ? (sessionStorage.getItem('access_token') || localStorage.getItem('access_token'))
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
      throw new Error(data.error || 'API request failed');
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
      ? (sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token'))
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
      sessionStorage.setItem('access_token', data.token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      sessionStorage.setItem('token_expiry', (Date.now() + 12 * 60 * 60 * 1000).toString());
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      // For backward compatibility
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expiry', (Date.now() + 12 * 60 * 60 * 1000).toString());
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update cookie
      document.cookie = `auth_token=${data.token}; max-age=${60*60*12}; path=/; SameSite=Strict`;
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
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expiry');
    sessionStorage.removeItem('user');
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    
    // Clear cookie
    document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Strict';
    
    // Redirect to login page
    window.location.href = '/login';
  }
} 