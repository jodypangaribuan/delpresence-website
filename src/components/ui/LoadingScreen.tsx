"use client";

import React from 'react';

interface LoadingScreenProps {
  message?: string;
  bgColor?: string;
  textColor?: string;
  spinnerColor?: string;
}

export default function LoadingScreen({
  message = "Loading...",
  bgColor = "#FFFFFF",
  textColor = "#0687C9",
  spinnerColor = "#0687C9"
}: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] animate-fadeIn"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-center">
        {/* Spinner */}
        <div
          className="inline-block h-12 w-12 mb-4"
          style={{
            border: `3px solid rgba(6, 135, 201, 0.2)`,
            borderTop: `3px solid ${spinnerColor}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        
        {/* Message text */}
        <div
          className="text-lg font-medium"
          style={{ color: textColor }}
        >
          {message}
        </div>
        
        {/* Animation keyframes */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
} 