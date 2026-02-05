import { apiClient } from '@lib/api/client';
import type {
  Notification,
  NotificationApiResponse,
  NotificationListApiResponse,
  UnreadCountApiResponse,
  MarkAllReadApiResponse,
  NotificationListResult,
  NotificationType,
  NotificationTypeApiResponse,
  NotificationPreference,
  NotificationPreferenceApiResponse,
  NotificationPreferenceInput,
  NotificationMetadata,
} from '../types/notification';

// ── Mappers (snake_case -> camelCase) ──────────────────────────────────

function mapMetadata(raw: Record<string, unknown>): NotificationMetadata {
  return {
    actorName: raw.actor_name as string | undefined,
    actorAvatarUrl: raw.actor_avatar_url as string | undefined,
    entityTitle: raw.entity_title as string | undefined,
    workspaceName: raw.workspace_name as string | undefined,
    oldRole: raw.old_role as string | undefined,
    newRole: raw.new_role as string | undefined,
    groupName: raw.group_name as string | undefined,
    changesSummary: raw.changes_summary as string | undefined,
    ...raw,
  };
}

function mapNotification(raw: NotificationApiResponse): Notification {
  return {
    id: raw.id,
    notificationId: raw.notification_id,
    type: raw.type,
    workspaceId: raw.workspace_id,
    actorId: raw.actor_id,
    entityType: raw.entity_type,
    entityId: raw.entity_id,
    metadata: mapMetadata(raw.metadata),
    isRead: raw.is_read,
    readAt: raw.read_at,
    createdAt: raw.created_at,
  };
}

function mapNotificationType(raw: NotificationTypeApiResponse): NotificationType {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    template: raw.template,
    isMandatory: raw.is_mandatory,
  };
}

function mapPreference(raw: NotificationPreferenceApiResponse): NotificationPreference {
  return {
    id: raw.id,
    channel: raw.channel,
    enabled: raw.enabled,
    workspaceId: raw.workspace_id,
    notificationType: raw.notification_type,
  };
}

// ── API Client ─────────────────────────────────────────────────────────

export const notificationApi = {
  // ── Workspace-scoped endpoints ────────────────────────────────────

  /** List notifications for a specific workspace */
  getForWorkspace: async (
    workspaceId: string,
    params?: { is_read?: boolean; type?: string; cursor?: string; limit?: number },
  ): Promise<NotificationListResult> => {
    const response = await apiClient.get<NotificationListApiResponse>(
      `/workspaces/${workspaceId}/notifications`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
    return {
      notifications: response.data.map(mapNotification),
      unreadCount: response.meta.unread_count,
      nextCursor: response.meta.next_cursor,
    };
  },

  /** Get unread count for a specific workspace */
  getUnreadCount: async (workspaceId: string): Promise<number> => {
    const response = await apiClient.get<UnreadCountApiResponse>(
      `/workspaces/${workspaceId}/notifications/unread-count`,
    );
    return response.data.count;
  },

  /** Mark a single notification as read */
  markRead: async (workspaceId: string, recipientId: string): Promise<void> => {
    await apiClient.patch(`/workspaces/${workspaceId}/notifications/${recipientId}/read`);
  },

  /** Mark a single notification as unread */
  markUnread: async (workspaceId: string, recipientId: string): Promise<void> => {
    await apiClient.patch(`/workspaces/${workspaceId}/notifications/${recipientId}/unread`);
  },

  /** Mark all notifications as read in a workspace */
  markAllRead: async (workspaceId: string): Promise<number> => {
    const response = await apiClient.post<MarkAllReadApiResponse>(
      `/workspaces/${workspaceId}/notifications/mark-all-read`,
    );
    return response.data.count;
  },

  /** Soft-delete a notification */
  remove: async (workspaceId: string, recipientId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/notifications/${recipientId}`);
  },

  // ── User-scoped endpoints ─────────────────────────────────────────

  /** Cross-workspace notification feed */
  getAll: async (params?: {
    is_read?: boolean;
    type?: string;
    cursor?: string;
    limit?: number;
  }): Promise<NotificationListResult> => {
    const response = await apiClient.get<NotificationListApiResponse>('/users/me/notifications', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    return {
      notifications: response.data.map(mapNotification),
      unreadCount: response.meta.unread_count,
      nextCursor: response.meta.next_cursor,
    };
  },

  /** Cross-workspace total unread count */
  getTotalUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<UnreadCountApiResponse>(
      '/users/me/notifications/unread-count',
    );
    return response.data.count;
  },

  /** Mark all as read across all workspaces */
  markAllReadGlobal: async (): Promise<number> => {
    const response = await apiClient.post<MarkAllReadApiResponse>(
      '/users/me/notifications/mark-all-read',
    );
    return response.data.count;
  },

  // ── Preferences ───────────────────────────────────────────────────

  /** Get user's notification preferences */
  getPreferences: async (): Promise<NotificationPreference[]> => {
    const response = await apiClient.get<{ data: NotificationPreferenceApiResponse[] }>(
      '/users/me/notification-preferences',
    );
    return response.data.map(mapPreference);
  },

  /** Upsert a notification preference */
  updatePreference: async (input: NotificationPreferenceInput): Promise<NotificationPreference> => {
    const response = await apiClient.put<{ data: NotificationPreferenceApiResponse }>(
      '/users/me/notification-preferences',
      {
        channel: input.channel,
        enabled: input.enabled,
        workspace_id: input.workspaceId,
        notification_type: input.notificationType,
      },
    );
    return mapPreference(response.data);
  },

  // ── Notification Types ────────────────────────────────────────────

  /** Get available notification types (for preferences UI) */
  getTypes: async (): Promise<NotificationType[]> => {
    const response = await apiClient.get<{ data: NotificationTypeApiResponse[] }>(
      '/users/me/notification-types',
    );
    return response.data.map(mapNotificationType);
  },
};
