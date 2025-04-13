"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layouts/dashboard/dashboard-layout";
import { isAuthenticated } from "./page";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Check authentication on client-side
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    setAuthorized(true);
  }, [router]);

  // Show nothing while checking authentication
  if (!authorized) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
} 