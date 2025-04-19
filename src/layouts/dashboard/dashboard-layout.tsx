"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import LoadingBar from "@/components/ui/LoadingBar";

// Helper function to get page title from pathname
const getPageTitleFromPath = (pathname: string): string => {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  
  // Get last segment of the path for the menu name
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  
  // Convert to title case
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Update document title based on the current path
    const pageTitle = getPageTitleFromPath(pathname);
    document.title = `Dashboard - ${pageTitle}`;
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      <LoadingBar />
      
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-30 transform transition-all duration-300 lg:hidden ${
          isSidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        }`}
      >
        <div className="relative h-full">
          <div className="h-full w-[260px]">
            <Sidebar />
          </div>
          <div
            className="fixed inset-0 bg-neutral-900/20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-[260px]">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
} 