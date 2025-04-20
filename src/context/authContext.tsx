"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createRoot } from 'react-dom/client';
import LoadingScreen from '@/components/ui/LoadingScreen';

// User role enum
export enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
  EMPLOYEE = "Pegawai",
  STUDENT = "Mahasiswa",
}

// User interface
export interface User {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
  role: string;
  photo?: string;
  external_user_id?: number | null;
}

// Auth Context State
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkRole: (roles: string[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthState | undefined>(undefined);

// Create provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    // Only initialize once
    if (initialized) return;

    const initAuth = () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        
        // Get auth data from secure storage
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        const expiry = sessionStorage.getItem('token_expiry') || localStorage.getItem('token_expiry');
        const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        console.log("[AuthContext] Token exists:", !!token);
        console.log("[AuthContext] Expiry exists:", !!expiry);
        console.log("[AuthContext] User exists:", !!userJson);
        
        if (token && expiry && parseInt(expiry) > Date.now() && userJson) {
          console.log("[AuthContext] Valid auth data found");
          try {
            const userData = JSON.parse(userJson);
            setUser(userData);
            setIsAuthenticated(true);
            
            // Set HTTP-only secure cookie for backend API requests
            document.cookie = `auth_token=${token}; max-age=${60*60*12}; path=/; SameSite=Strict`;
            console.log("[AuthContext] Authentication successful");
          } catch (parseError) {
            console.error("[AuthContext] Error parsing user data:", parseError);
            clearAuthData();
          }
        } else {
          console.log("[AuthContext] No valid auth data found, clearing");
          clearAuthData();
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, [initialized]);

  // Clear auth data from all storage mechanisms
  const clearAuthData = () => {
    console.log("[AuthContext] Clearing auth data");
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
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    console.log("[AuthContext] Login attempt for:", username);
    
    try {
      // Backend API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Try campus login first for lecturers and assistants
      try {
        console.log("[AuthContext] Attempting campus login");
        // Create FormData for campus login
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        
        // Call the campus login API 
        const campusResponse = await fetch(`${apiUrl}/api/auth/campus/login`, {
          method: "POST",
          body: formData,
          credentials: 'same-origin', // Include cookies
        });

        // Parse response
        const campusData = await campusResponse.json();

        // Only proceed if login was successful
        if (campusResponse.ok && campusData.result && 
            (campusData.user.role === "Dosen" || campusData.user.role === "Asisten Dosen")) {
          console.log("[AuthContext] Campus login successful, role:", campusData.user.role);
          
          // Create login data
          const userData = {
            id: campusData.user.user_id,
            username: campusData.user.username,
            name: campusData.user.name || "",
            email: campusData.user.email,
            role: campusData.user.role,
            photo: campusData.user.photo || "",
          };

          // Save auth data securely
          saveAuthData(campusData.token, campusData.refresh_token, userData);
          return;
        }
      } catch (campusError) {
        console.log("[AuthContext] Campus login failed, trying admin login");
      }
      
      // If campus login failed or returned invalid role, try admin login
      console.log("[AuthContext] Attempting admin login");
      const adminResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
        credentials: 'same-origin', // Include cookies
      });

      // Parse response
      const adminData = await adminResponse.json();

      if (!adminResponse.ok) {
        console.error("[AuthContext] Admin login failed:", adminData.error);
        throw new Error(adminData.error || "Login failed");
      }

      console.log("[AuthContext] Admin login successful, role:", adminData.user.role);
      // Save auth data securely
      saveAuthData(adminData.token, adminData.refresh_token, adminData.user);
      
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      clearAuthData();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Save auth data securely
  const saveAuthData = (token: string, refreshToken: string, userData: User) => {
    console.log("[AuthContext] Saving auth data for user:", userData.username);
    // Calculate expiry time (12 hours from now)
    const expiryTime = Date.now() + 12 * 60 * 60 * 1000;
    
    // Prefer session storage for better security (cleared when browser closes)
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('refresh_token', refreshToken);
    sessionStorage.setItem('token_expiry', expiryTime.toString());
    sessionStorage.setItem('user', JSON.stringify(userData));
    
    // For backward compatibility
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('token_expiry', expiryTime.toString());
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Set HTTP-only secure cookie for backend API requests
    document.cookie = `auth_token=${token}; max-age=${60*60*12}; path=/; SameSite=Strict`;
    
    // Update state
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    console.log("[AuthContext] Logging out");
    
    // Show elegant loading screen during logout
    showLogoutScreen();
    
    // Small delay to ensure the loading screen shows
    setTimeout(() => {
      // Clear all auth data
      clearAuthData();
      
      // Clear redirect information
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('lastAuthRedirect');
      sessionStorage.removeItem('lastLoginRedirect');
      
      // Use window.location instead of router.push to ensure a full page reload
      window.location.href = '/login';
    }, 500);
  };
  
  // Function to show a clean logout screen with spinner
  const showLogoutScreen = () => {
    // Only run client-side
    if (typeof document === 'undefined') return;
    
    // Create a container for the loading screen
    const container = document.createElement('div');
    container.id = 'logout-loading-container';
    document.body.appendChild(container);
    
    // Create loading UI with React
    const root = createRoot(container);
    
    // Render the elegant loading screen
    root.render(<LoadingScreen message="Keluar" />);
  };

  // Check if user has one of the specified roles
  const checkRole = (roles: string[]): boolean => {
    if (!user) return false;
    const hasRole = roles.includes(user.role);
    console.log("[AuthContext] Role check:", user.role, "required:", roles, "result:", hasRole);
    return hasRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function for role checking
export function useRole(requiredRoles: string[] = []) {
  const { user, checkRole } = useAuth();
  
  const hasRequiredRole = requiredRoles.length === 0 || checkRole(requiredRoles);
  
  return {
    hasRequiredRole,
    userRole: user?.role || '',
  };
} 