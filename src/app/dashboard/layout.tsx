"use client";

import { useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole, useAuth } from "@/context/authContext";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Add debugging log for dashboard layout
  useEffect(() => {
    console.log("[DashboardLayout] Rendering dashboard, auth state:", { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);
  
  // All users with valid authentication can access the dashboard
  // Role-specific restrictions are handled in each section
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
} 