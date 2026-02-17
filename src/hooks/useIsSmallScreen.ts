import { MEDIA_QUERIES } from '@/constants';
import { useMediaQuery } from './useMediaQuery';

/**
 * Returns `true` when the viewport is below the `sm` breakpoint (640px).
 * Use this for pure LAYOUT decisions (indentation, spacing, column count).
 *
 * For detecting actual mobile devices, use `useIsMobile()` instead.
 * For detecting touch input, use `useIsCoarsePointer()` instead.
 */
export function useIsSmallScreen(): boolean {
  return useMediaQuery(MEDIA_QUERIES.MOBILE);
}
