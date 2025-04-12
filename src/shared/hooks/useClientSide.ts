import { useState, useEffect } from 'react';

/**
 * Hook to safely check if code is running on the client-side
 * Useful for avoiding hydration mismatches with components that use browser APIs
 * 
 * @returns {boolean} - True if running on client-side, false during server-side rendering
 */
export function useClientSide(): boolean {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
} 