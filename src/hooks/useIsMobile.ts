import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640; // Tailwind's `sm` breakpoint

/**
 * Detects whether the viewport is below 640px (Tailwind `sm` breakpoint).
 * Uses `window.matchMedia` for efficient, event-driven detection.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Sync initial state
    setIsMobile(mql.matches);

    mql.addEventListener('change', handleChange);
    return () => {
      mql.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobile;
}
