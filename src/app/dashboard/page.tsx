"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

export enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
}

// Get user from localStorage
export function getUser() {
  if (typeof window === "undefined") return null;
  
  const userJson = localStorage.getItem("user");
  if (!userJson) {
    return {
      id: "1",
      name: "Administrator",
      role: UserRole.ADMIN,
    };
  }
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Error parsing user data:", e);
    return {
      id: "1",
      name: "Administrator",
      role: UserRole.ADMIN,
    };
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return true; // For SSR
  
  const token = localStorage.getItem("access_token");
  const expiry = localStorage.getItem("token_expiry");
  
  if (!token || !expiry) return false;
  
  return parseInt(expiry) > Date.now();
}

// Get user role
export function getUserRole(): UserRole {
  const user = getUser();
  if (!user) return UserRole.ADMIN; // Default for development
  
  switch (user.role) {
    case "Admin":
      return UserRole.ADMIN;
    case "Dosen":
      return UserRole.LECTURER;
    case "Asisten Dosen":
      return UserRole.ASSISTANT;
    default:
      return UserRole.ADMIN;
  }
}

// Logout function
export function logout() {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expiry");
  localStorage.removeItem("user");
  
  window.location.href = "/login";
}

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

export default function DashboardPage() {
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
    <Suspense fallback={<Loader />}>
      {userRole === UserRole.ADMIN && <AdminDashboard />}
      {userRole === UserRole.LECTURER && <LecturerDashboard />}
      {userRole === UserRole.ASSISTANT && <AssistantDashboard />}
    </Suspense>
  );
} 