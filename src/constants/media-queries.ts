import { BREAKPOINTS } from './breakpoints';

/**
 * CSS media query strings used by detection hooks.
 * Single source of truth -- avoids magic strings scattered across hooks.
 */
export const MEDIA_QUERIES = {
  /** Viewport below the `sm` breakpoint (640px) */
  MOBILE: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  /** Primary pointer is coarse (touch input) */
  COARSE_POINTER: '(pointer: coarse)',
  /** User prefers reduced motion */
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
} as const;
