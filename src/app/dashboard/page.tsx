"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { UserRole, getUser, isAuthenticated, getUserRole } from "@/utils/auth";

// Dynamically import components
const AdminDashboard = dynamic(() => import("./components/admin-dashboard"), {
  loading: () => <Loader />,
});

const LecturerDashboard = dynamic(() => import("./components/lecturer-dashboard"), {
  loading: () => <Loader />,
});

const AssistantDashboard = dynamic(() => import("./components/assistant-dashboard"), {
  loading: () => <Loader />,
});

// Loader component
function Loader() { 
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#0687C9]" />
    </div>
  );
}

// Main dashboard content that uses hooks
function DashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    
    const role = getUserRole();
    setUserRole(role);
    setLoading(false);
    
    // Log user info for debugging
    console.log("User info:", getUser());
    console.log("User role:", role);
  }, [router]);
  
  if (loading) {
    return <Loader />;
  }
  
  // Show dashboard based on user role
  return (
    <>
      {userRole === UserRole.ADMIN && <AdminDashboard />}
      {userRole === UserRole.LECTURER && <LecturerDashboard />}
      {userRole === UserRole.ASSISTANT && <AssistantDashboard />}
    </>
  );
}

// Main dashboard page with Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent />
    </Suspense>
  );
} 