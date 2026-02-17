import { MEDIA_QUERIES } from '@/constants';
import { useMediaQuery } from './useMediaQuery';

/**
 * Returns `true` when the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(MEDIA_QUERIES.REDUCED_MOTION);
}
