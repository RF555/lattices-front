import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type { Notification, NotificationPreferences } from '../types/notification';

interface ApiNotification {
  id: string;
  type: string;
  actor_name: string;
  actor_avatar_url: string | null;
  entity_type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
}

function mapNotification(raw: ApiNotification): Notification {
  return {
    id: raw.id,
    type: raw.type,
    actorName: raw.actor_name,
    actorAvatarUrl: raw.actor_avatar_url,
    entityType: raw.entity_type,
    entityId: raw.entity_id,
    message: raw.message,
    isRead: raw.is_read,
    isSeen: raw.is_seen,
    createdAt: raw.created_at,
  };
}

export const notificationApi = {
  async getNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await apiClient.get<ListResponse<ApiNotification>>('/notifications', {
      params,
    });
    return response.data.map(mapNotification);
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<SingleResponse<{ count: number }>>(
      '/notifications/unread-count'
    );
    return response.data.count;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}`, { is_read: true });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<SingleResponse<NotificationPreferences>>(
      '/notifications/preferences'
    );
    return response.data;
  },

  async updatePreferences(prefs: NotificationPreferences): Promise<void> {
    await apiClient.put('/notifications/preferences', prefs);
  },
};
