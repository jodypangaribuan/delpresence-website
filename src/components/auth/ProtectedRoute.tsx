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
        
        // Clear any path-specific session state to prevent path persistence between different user roles
        sessionStorage.removeItem('lastPath');
        sessionStorage.removeItem('previousPath');
        
        // Use replace instead of href to clear the history entry
        window.location.replace('/dashboard');
      }
    };
    
    handleAuthRedirect();
  }, [isAuthenticated, isLoading, pathname, user, requiredRoles, checkRole, isClient]);

  // Show loading while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
        <span className="ml-2 text-[#0687C9] font-medium">Memeriksa akses...</span>
      </div>
    );
  }

  // Show forbidden message if not authorized
  if (!isLoading && isAuthenticated && requiredRoles.length > 0 && !checkRole(requiredRoles)) {
    // Immediately redirect to dashboard if not authorized
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
    
    // In the meantime, show a loading indicator instead of the unauthorized content
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
        <span className="ml-2 text-[#0687C9] font-medium">Memeriksa akses...</span>
      </div>
    );
  }

  // Show content only if authenticated
  return isAuthenticated ? <>{children}</> : null;
} 