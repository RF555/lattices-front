/** Notification panel filter options */
export const NOTIFICATION_FILTERS = {
  ALL: 'all',
  UNREAD: 'unread',
} as const;

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

/** Max badge display count before showing "99+" */
export const MAX_BADGE_COUNT = 99;
