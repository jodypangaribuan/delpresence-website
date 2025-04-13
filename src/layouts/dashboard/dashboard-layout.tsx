"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
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
          <div className="h-full w-[240px]">
            <Sidebar />
          </div>
          <div
            className="fixed inset-0 bg-neutral-900/20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-[240px]">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6 relative">{children}</main>
      </div>
    </div>
  );
} 