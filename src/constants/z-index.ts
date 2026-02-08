/**
 * Z-index layering scale with 100 gaps for easy insertion.
 * Used in both Tailwind config and inline styles.
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  OVERLAY: 300,
  MODAL: 400,
  NOTIFICATION: 500,
  TOAST: 600,
  BANNER: 700,
} as const;

export type ZIndexLayer = (typeof Z_INDEX)[keyof typeof Z_INDEX];
