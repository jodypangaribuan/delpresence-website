"use client";

import React, { useEffect, useState } from "react";
import { useLoading } from "@/context/loadingContext";
import LoadingSpinner from "./LoadingSpinner";

type LoadingOverlayProps = {
  fullScreen?: boolean;
};

export default function LoadingOverlay({ fullScreen = false }: LoadingOverlayProps) {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(false);
  
  // Add a slight delay before showing the overlay to avoid flashing
  // for very quick navigations
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setVisible(true);
      }, 300); // Only show overlay if loading takes more than 300ms
    } else {
      setVisible(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading]);

  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0" : "absolute inset-0"
      } bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-50 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        transform: visible ? "translateY(0)" : "translateY(10px)"
      }}
    >
      <div className="flex flex-col items-center">
        <LoadingSpinner size="lg" text="Sedang memuat..." />
      </div>
    </div>
  );
} 