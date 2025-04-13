"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_OPTIONS: FetchOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  retry: 1,
  retryDelay: 1000,
};

/**
 * Hook untuk fetching data dengan optimasi
 */
export function useFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): [FetchState<T>, (newOptions?: FetchOptions) => Promise<T | null>, () => void] {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const optionsRef = useRef<FetchOptions>({ ...DEFAULT_OPTIONS, ...options });
  const activeRequestRef = useRef<AbortController | null>(null);

  // Update options when they change
  useEffect(() => {
    optionsRef.current = { ...DEFAULT_OPTIONS, ...options };
  }, [options]);

  // Abort fetch when component unmounts
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, []);

  // Fungsi untuk melakukan fetch
  const fetchData = useCallback(
    async (newOptions: FetchOptions = {}): Promise<T | null> => {
      // Abort any running request
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      activeRequestRef.current = abortController;

      const currentOptions = { ...optionsRef.current, ...newOptions };
      const { retry, retryDelay, onSuccess, onError, ...fetchOptions } = currentOptions;

      // Prepare body if needed
      let finalBody = fetchOptions.body;
      if (finalBody && typeof finalBody === "object") {
        finalBody = JSON.stringify(finalBody);
      }

      // Set loading state
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      let retries = 0;
      let result: T | null = null;

      while (retries <= (retry || 0)) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            body: finalBody,
            signal: abortController.signal,
            method: fetchOptions.method || "GET",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setState({ data, isLoading: false, error: null });
          
          if (onSuccess) {
            onSuccess(data);
          }
          
          result = data;
          break; // Exit loop on success
        } catch (error: any) {
          // If aborted, don't retry
          if (error.name === "AbortError") {
            break;
          }

          retries++;
          if (retries <= (retry || 0)) {
            // Wait before retrying
            await new Promise((r) => setTimeout(r, retryDelay));
          } else {
            // Final error
            setState({ data: null, isLoading: false, error: error as Error });
            
            if (onError) {
              onError(error as Error);
            }
          }
        }
      }

      // Reset active request
      activeRequestRef.current = null;
      return result;
    },
    [url]
  );

  // Fungsi untuk reset state
  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return [state, fetchData, reset];
} 