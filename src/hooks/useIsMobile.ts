import { MEDIA_QUERIES } from '@/constants';
import { useMediaQuery } from './useMediaQuery';

/**
 * Returns `true` when the device is actually mobile: small screen AND touch input.
 * A narrow desktop browser window returns `false` (no touch).
 * A large tablet returns `false` (screen is not small).
 *
 * For pure screen-size checks, use `useIsSmallScreen()`.
 * For pure touch detection, use `useIsCoarsePointer()`.
 */
export function useIsMobile(): boolean {
  const isSmallScreen = useMediaQuery(MEDIA_QUERIES.MOBILE);
  const isCoarsePointer = useMediaQuery(MEDIA_QUERIES.COARSE_POINTER);
  return isSmallScreen && isCoarsePointer;
}
