// Types
export type { Notification, NotificationPreferences } from './types/notification';

// API
export { notificationApi } from './api/notificationApi';

// Hooks
export {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from './hooks/useNotifications';
