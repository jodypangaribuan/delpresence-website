"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/context/authContext";

export default function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
} 