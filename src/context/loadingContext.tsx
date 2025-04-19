"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

type LoadingContextType = {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Keep track of previous path to determine if navigation occurred
  const [prevPath, setPrevPath] = useState("");
  const [prevSearchParams, setPrevSearchParams] = useState("");

  // Set isLoading to true when the route changes
  useEffect(() => {
    const currentSearchParams = searchParams.toString();
    const currentFullPath = `${pathname}?${currentSearchParams}`;
    const previousFullPath = `${prevPath}?${prevSearchParams}`;

    if (prevPath && currentFullPath !== previousFullPath) {
      // Route has changed
      setIsLoading(true);
      
      // Simulate a loading delay (can be adjusted as needed)
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => {
        clearTimeout(timeout);
      };
    }
    
    // Update previous path
    setPrevPath(pathname);
    setPrevSearchParams(currentSearchParams);
    
    // On initial load, don't show loading
    if (!prevPath) {
      return;
    }
  }, [pathname, searchParams, prevPath, prevSearchParams]);

  // Listen for navigation events using the router
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      // Add a slight delay before hiding the loader for better UX
      setTimeout(() => setIsLoading(false), 300);
    };

    // Simulate capturing router events since Next.js App Router doesn't have built-in events
    // This is a fallback mechanism in case the pathname/searchParams detection doesn't work
    
    // Watch for click events on anchor elements
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        setIsLoading(true);
      }
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [router]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
} 