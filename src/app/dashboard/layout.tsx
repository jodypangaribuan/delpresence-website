"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole, useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Helper function to check if a path is restricted to specific roles
const getRequiredRolesForPath = (path: string): UserRole[] => {
  // Admin-only paths
  if (path.includes('/dashboard/academic/') || 
      path.includes('/dashboard/attendance/overview') ||
      path.includes('/dashboard/courses/manage') ||
      path.includes('/dashboard/schedules/manage') ||
      path.includes('/dashboard/users/') ||
      path.includes('/dashboard/attendances/face-recognition')) {
    return [UserRole.ADMIN];
  }
  
  // Lecturer-only paths
  if (path.includes('/dashboard/lecturer/')) {
    return [UserRole.LECTURER];
  }
  
  // Assistant-only paths
  if (path.includes('/dashboard/assistant/')) {
    return [UserRole.ASSISTANT];
  }
  
  // No restrictions for general dashboard paths
  return [];
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Immediately check authorization on path or user change
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const requiredRoles = getRequiredRolesForPath(pathname);
      
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
        console.log(`[DashboardLayout] Access denied: ${pathname} requires ${requiredRoles.join(', ')}, user is ${user.role}`);
        setIsAuthorized(false);
        
        // Redirect to dashboard immediately
        router.replace('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    } else if (!isLoading) {
      // If not authenticated and done loading, consider unauthorized
      setIsAuthorized(false);
    }
  }, [pathname, isAuthenticated, isLoading, user, router]);
  
  // If still checking authorization or found unauthorized, show a loading screen
  if (isLoading || isAuthorized === null || isAuthorized === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
        <span className="ml-2 text-[#0687C9] font-medium">Memeriksa akses...</span>
      </div>
    );
  }
  
  // Only render the actual content when explicitly authorized
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
} 