import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/constants';

/**
 * Detects whether the viewport is below the `sm` breakpoint (640px).
 * Uses `window.matchMedia` for efficient, event-driven detection.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.sm : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.sm - 1}px)`);

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
