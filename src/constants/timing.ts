/** Animation durations in milliseconds */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

/** Toast notification timing in milliseconds */
export const TOAST = {
  DEFAULT_DURATION_MS: 4000,
  ERROR_DURATION_MS: 6000,
  EXIT_ANIMATION_MS: 150,
} as const;

/** TanStack Query cache timing in milliseconds */
export const QUERY_CACHE = {
  STALE_SHORT: 30_000,
  STALE_MEDIUM: 2 * 60 * 1000,
  STALE_LONG: 5 * 60 * 1000,
  GC_DEFAULT: 30 * 60 * 1000,
  DEFAULT_RETRY: 3,
} as const;

/** Backend wake-up / cold start retry timing */
export const WAKE_UP = {
  TIMEOUT_MS: 10_000,
  MAX_RETRIES: 10,
  RETRY_DELAY_MS: 2000,
  CACHE_THRESHOLD_MS: 60_000,
} as const;

/** Cold start banner display timing in milliseconds */
export const COLD_START = {
  SHOW_DELAY_MS: 2000,
  FAST_THRESHOLD_MS: 2000,
  READY_DISPLAY_MS: 1500,
} as const;
