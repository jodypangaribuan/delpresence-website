"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { debounce, throttle, rafThrottle } from "@/core/utils/performance";

// Hook untuk debounce
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook untuk membuat fungsi debounce
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 500
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay]
  );
}

// Hook untuk membuat fungsi throttle
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    throttle((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, limit),
    [limit]
  );
}

// Hook untuk membuat fungsi RAF throttle
export function useRafCallback<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    rafThrottle((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }),
    []
  );
}

// Hook untuk intersection observer (lazy loading)
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverOptions = {},
  callback?: (entry: IntersectionObserverEntry) => void
): { isIntersecting: boolean; entry: IntersectionObserverEntry | null } {
  const [state, setState] = useState<{
    isIntersecting: boolean;
    entry: IntersectionObserverEntry | null;
  }>({
    isIntersecting: false,
    entry: null,
  });

  const { threshold = 0, root = null, rootMargin = "0%" } = options;

  useEffect(() => {
    const node = elementRef?.current;
    if (!node) return;

    const observerCallback: IntersectionObserverCallback = ([entry]) => {
      setState({
        isIntersecting: entry.isIntersecting,
        entry,
      });

      if (callback) callback(entry);
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold,
      root,
      rootMargin,
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [callback, elementRef, root, rootMargin, threshold]);

  return state;
}

interface IntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
} 