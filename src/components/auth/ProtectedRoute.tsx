"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

// Helper to prevent infinite redirects
const REDIRECT_TIMEOUT = 2000; // 2 seconds timeout between redirects

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, checkRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client and when auth is determined
    if (!isClient || isLoading) return;

    // Log for debugging
    console.log("[ProtectedRoute] Path:", pathname);
    console.log("[ProtectedRoute] Auth state:", { isLoading, isAuthenticated, userRole: user?.role });

    const handleAuthRedirect = () => {
      // Get last redirect timestamp
      const lastRedirectTime = sessionStorage.getItem('lastAuthRedirect') 
        ? parseInt(sessionStorage.getItem('lastAuthRedirect') || '0')
        : 0;
        
      const currentTime = Date.now();
      
      // Check if we're in a redirect cooldown period
      if (currentTime - lastRedirectTime < REDIRECT_TIMEOUT) {
        console.log('[ProtectedRoute] Redirect cooldown active, skipping redirect');
        return;
      }
      
      if (!isAuthenticated) {
        // Only redirect to login if not already on login page
        if (pathname !== '/login') {
          console.log("[ProtectedRoute] Not authenticated, redirecting to login");
          sessionStorage.setItem('lastAuthRedirect', currentTime.toString());
          sessionStorage.setItem('redirectAfterLogin', pathname); // Save current path
          window.location.href = '/login';
        }
      } else if (requiredRoles.length > 0 && !checkRole(requiredRoles)) {
        // For role-based protection
        console.log("[ProtectedRoute] Insufficient permissions for", pathname);
        sessionStorage.setItem('lastAuthRedirect', currentTime.toString());
        window.location.href = '/dashboard';
      }
    };
    
    handleAuthRedirect();
  }, [isAuthenticated, isLoading, pathname, user, requiredRoles, checkRole, isClient]);

  // Show loading while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
        <span className="ml-2 text-[#0687C9] font-medium">Verifying access...</span>
      </div>
    );
  }

  // Show forbidden message if not authorized
  if (!isLoading && isAuthenticated && requiredRoles.length > 0 && !checkRole(requiredRoles)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You don't have permission to access this page.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Show content only if authenticated
  return isAuthenticated ? <>{children}</> : null;
} 