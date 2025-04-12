"use client";

/**
 * Layout untuk halaman legal (Privacy Policy dan Terms of Use)
 * Menggunakan Suspense boundaries untuk meningkatkan performa loading
 * Memastikan tema selalu cerah terlepas dari pengaturan sistem
 */
import { Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { siteConfig } from '@/shared/utils/siteConfig';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colors } = siteConfig;
  
  return (
    <div 
      className="min-h-screen bg-white !text-slate-800"
      style={{
        backgroundColor: '#ffffff',
        // Force light theme colors regardless of system preferences
        colorScheme: 'light',
        color: '#334155', // slate-700
        forcedColorAdjust: 'none'
      }}
      data-theme="light"
      data-force-light="true"
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Memuat halaman legal..." />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
} 