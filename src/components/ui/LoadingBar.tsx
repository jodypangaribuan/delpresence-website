"use client";

import React, { useEffect, useState } from "react";
import { useLoading } from "@/context/loadingContext";

export default function LoadingBar() {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      // Make bar visible immediately
      setVisible(true);
      
      // Reset progress
      setProgress(0);
      
      // Simulate progress - make it slightly faster for better UX
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          // Adjust progression for smoother experience
          if (prevProgress >= 90) {
            return prevProgress + 0.3;
          }
          if (prevProgress >= 80) {
            return prevProgress + 0.8;
          }
          if (prevProgress >= 60) {
            return prevProgress + 2;
          }
          return prevProgress + 6;
        });
      }, 80);
    } else {
      // Quickly complete the bar when loading is done
      setProgress(100);
      
      // Hide the bar after completion animation
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <>
      <div 
        className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-gray-200/30"
      />
      <div 
        className="fixed top-0 left-0 h-1.5 z-50 transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #0687C9 0%, #0C9AE4 75%, #10B3FF 100%)',
          boxShadow: '0 0 8px rgba(6, 135, 201, 0.6)',
          transition: isLoading ? "width 0.1s ease-out" : "width 0.3s ease-out"
        }}
      >
        {/* Animated glow effect at the end of the progress bar */}
        <div 
          className="absolute top-0 right-0 bottom-0 w-24 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, rgba(6, 135, 201, 0) 0%, rgba(16, 179, 255, 0.8) 100%)'
          }}
        />
      </div>
    </>
  );
} 