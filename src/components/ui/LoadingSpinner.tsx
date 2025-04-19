"use client";

import React from "react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  color?: string;
};

export default function LoadingSpinner({
  size = "md",
  text,
  color = "#0687C9",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
          style={{ borderColor: `${color}40`, borderTopColor: 'transparent' }}
        />
        <div
          className={`absolute top-0 left-0 animate-ping opacity-75 rounded-full ${sizeClasses[size]}`}
          style={{ 
            borderColor: color, 
            borderTopColor: 'transparent',
            animationDuration: '1.5s',
            animationIterationCount: 'infinite'
          }}
        />
        <div
          className={`absolute top-0 left-0 animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
          style={{ 
            borderColor: color, 
            borderTopColor: 'transparent',
            animationDuration: '0.7s'
          }}
        />
      </div>
      {text && (
        <p 
          className="text-sm font-medium animate-pulse"
          style={{ color }}
        >
          {text}
        </p>
      )}
    </div>
  );
} 