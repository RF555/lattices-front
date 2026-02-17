import { MEDIA_QUERIES } from '@/constants';
import { useMediaQuery } from './useMediaQuery';

/**
 * Returns `true` when the primary pointer is coarse (touch/finger input).
 * Use this for INTERACTION decisions (enabling swipe, enlarging touch targets).
 *
 * For LAYOUT decisions (screen size), use `useIsMobile()` instead.
 *
 * Based on CSS `(pointer: coarse)` media query. This detects the *primary*
 * pointer, so a Surface laptop using a mouse reports `false` even though
 * touch is available. This is intentional -- we optimize for the user's
 * current interaction mode, not device capability.
 */
export function useIsCoarsePointer(): boolean {
  return useMediaQuery(MEDIA_QUERIES.COARSE_POINTER);
}
