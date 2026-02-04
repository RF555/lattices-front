// Types
export type {
  Notification,
  NotificationMetadata,
  NotificationListResult,
  NotificationType,
  NotificationPreference,
  NotificationPreferenceInput,
} from './types/notification';

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  MANDATORY_NOTIFICATION_TYPES,
} from './types/notification';

// API
export { notificationApi } from './api/notificationApi';

// Hooks
export {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useNotificationTypes,
} from './hooks/useNotifications';

export { useNotificationRealtime } from './hooks/useNotificationRealtime';

// Stores
export {
  useNotificationUiStore,
  usePanelOpen,
  useShowToastOnNew,
  usePanelFilter,
} from './stores/notificationUiStore';

// Utils
export {
  formatNotificationMessage,
  getEntityRoute,
  getActorInitials,
} from './utils/formatNotification';

// Components
export { NotificationBell } from './components/NotificationBell/NotificationBell';
export { NotificationPanel } from './components/NotificationPanel/NotificationPanel';
export { NotificationItem } from './components/NotificationItem/NotificationItem';
export { NotificationPreferences } from './components/NotificationPreferences/NotificationPreferences';
