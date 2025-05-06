"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImportSchedulePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to schedule management page
    router.push("/dashboard/schedules/manage");
  }, [router]);

  return null;
} 