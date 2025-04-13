/**
 * Utilitas untuk optimasi performa
 */

// Fungsi untuk debounce (mengurangi jumlah pemanggilan fungsi)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Fungsi untuk throttle (membatasi jumlah pemanggilan fungsi)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Fungsi untuk memoize (cache hasil fungsi)
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

// Fungsi untuk raf throttle (throttle dengan requestAnimationFrame untuk animasi) 
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let throttled = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (throttled) return;
    
    throttled = true;
    
    requestAnimationFrame(() => {
      func(...args);
      throttled = false;
    });
  };
} 