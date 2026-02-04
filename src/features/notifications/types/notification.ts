export interface Notification {
  id: string;
  type: string;
  actorName: string;
  actorAvatarUrl: string | null;
  entityType: string;
  entityId: string;
  message: string;
  isRead: boolean;
  isSeen: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  [notificationType: string]: {
    inApp: boolean;
    email: boolean;
  };
}
