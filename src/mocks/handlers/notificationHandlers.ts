import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

// Helper functions for timestamps
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

// Mock data structures (using snake_case for API responses)
interface MockNotification {
  id: string;
  notification_id: string;
  type: string;
  workspace_id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  metadata: {
    actor_name?: string;
    actor_avatar_url?: string;
    entity_title?: string;
    workspace_name?: string;
    old_role?: string;
    new_role?: string;
    group_name?: string;
    changes_summary?: string;
    [key: string]: unknown;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface MockNotificationPreference {
  id: string;
  channel: 'in_app' | 'email';
  enabled: boolean;
  workspace_id: string | null;
  notification_type: string | null;
}

interface MockNotificationType {
  id: string;
  name: string;
  description: string | null;
  template: string;
  is_mandatory: boolean;
}

// Initial mock data
let mockNotifications: MockNotification[] = [
  {
    id: 'notif-1',
    notification_id: 'notif-id-1',
    type: 'task.completed',
    workspace_id: 'ws-1',
    actor_id: 'user-1',
    entity_type: 'todo',
    entity_id: 'todo-1',
    metadata: {
      actor_name: 'John Doe',
      actor_avatar_url: undefined,
      entity_title: 'Complete project setup',
    },
    is_read: false,
    read_at: null,
    created_at: minutesAgo(30),
  },
  {
    id: 'notif-2',
    notification_id: 'notif-id-2',
    type: 'member.added',
    workspace_id: 'ws-1',
    actor_id: 'user-2',
    entity_type: 'workspace',
    entity_id: 'ws-1',
    metadata: {
      actor_name: 'Jane Smith',
      workspace_name: 'Team Workspace',
    },
    is_read: true,
    read_at: hoursAgo(1),
    created_at: hoursAgo(2),
  },
  {
    id: 'notif-3',
    notification_id: 'notif-id-3',
    type: 'task.updated',
    workspace_id: 'ws-1',
    actor_id: 'user-3',
    entity_type: 'todo',
    entity_id: 'todo-2',
    metadata: {
      actor_name: 'Alice Brown',
      entity_title: 'Review pull request',
      changes_summary: 'Changed title and description',
    },
    is_read: false,
    read_at: null,
    created_at: hoursAgo(3),
  },
];

const mockPreferences: MockNotificationPreference[] = [
  {
    id: 'pref-1',
    channel: 'in_app',
    enabled: true,
    workspace_id: null,
    notification_type: 'task.completed',
  },
  {
    id: 'pref-2',
    channel: 'in_app',
    enabled: true,
    workspace_id: null,
    notification_type: 'task.updated',
  },
  {
    id: 'pref-3',
    channel: 'email',
    enabled: false,
    workspace_id: null,
    notification_type: 'task.completed',
  },
];

const mockTypes: MockNotificationType[] = [
  {
    id: 'type-1',
    name: 'task.completed',
    description: 'Task was completed',
    template: '{{actorName}} completed "{{entityTitle}}"',
    is_mandatory: false,
  },
  {
    id: 'type-2',
    name: 'task.updated',
    description: 'Task was updated',
    template: '{{actorName}} updated "{{entityTitle}}"',
    is_mandatory: false,
  },
  {
    id: 'type-3',
    name: 'member.added',
    description: 'Member added to workspace',
    template: '{{actorName}} added you to "{{workspaceName}}"',
    is_mandatory: true,
  },
  {
    id: 'type-4',
    name: 'member.removed',
    description: 'Member removed from workspace',
    template: 'You were removed from "{{workspaceName}}"',
    is_mandatory: true,
  },
  {
    id: 'type-5',
    name: 'member.role_changed',
    description: 'Member role changed',
    template: 'Your role in "{{workspaceName}}" was changed to {{newRole}}',
    is_mandatory: true,
  },
  {
    id: 'type-6',
    name: 'invitation.received',
    description: 'Invitation received',
    template: '{{actorName}} invited you to join "{{workspaceName}}"',
    is_mandatory: true,
  },
];

export const notificationHandlers = [
  // Get all notifications (cross-workspace)
  http.get(`${API_URL}/users/me/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const isRead = url.searchParams.get('is_read');
    const type = url.searchParams.get('type');
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = [...mockNotifications];

    if (isRead !== null) {
      filtered = filtered.filter((n) => n.is_read === (isRead === 'true'));
    }

    if (type) {
      filtered = filtered.filter((n) => n.type === type);
    }

    // Sort by created_at descending
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Handle cursor pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filtered.findIndex((n) => n.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginated = filtered.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < filtered.length ? paginated[paginated.length - 1].id : null;
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;

    return HttpResponse.json({
      data: paginated,
      meta: {
        unread_count: unreadCount,
        next_cursor: nextCursor,
      },
    });
  }),

  // Get workspace notifications
  http.get(`${API_URL}/workspaces/:workspaceId/notifications`, ({ params, request }) => {
    const url = new URL(request.url);
    const isRead = url.searchParams.get('is_read');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filtered = mockNotifications.filter((n) => n.workspace_id === params.workspaceId);

    if (isRead !== null) {
      filtered = filtered.filter((n) => n.is_read === (isRead === 'true'));
    }

    if (type) {
      filtered = filtered.filter((n) => n.type === type);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const paginated = filtered.slice(0, limit);
    const unreadCount = filtered.filter((n) => !n.is_read).length;

    return HttpResponse.json({
      data: paginated,
      meta: {
        unread_count: unreadCount,
        next_cursor: null,
      },
    });
  }),

  // Get total unread count (cross-workspace)
  http.get(`${API_URL}/users/me/notifications/unread-count`, () => {
    const count = mockNotifications.filter((n) => !n.is_read).length;
    return HttpResponse.json({
      data: { count },
    });
  }),

  // Get workspace unread count
  http.get(`${API_URL}/workspaces/:workspaceId/notifications/unread-count`, ({ params }) => {
    const count = mockNotifications.filter(
      (n) => n.workspace_id === params.workspaceId && !n.is_read,
    ).length;
    return HttpResponse.json({
      data: { count },
    });
  }),

  // Mark as read
  http.patch(`${API_URL}/workspaces/:workspaceId/notifications/:recipientId/read`, ({ params }) => {
    const notification = mockNotifications.find((n) => n.id === params.recipientId);
    if (!notification) {
      return HttpResponse.json(
        { error_code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
        { status: 404 },
      );
    }
    notification.is_read = true;
    notification.read_at = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),

  // Mark as unread
  http.patch(
    `${API_URL}/workspaces/:workspaceId/notifications/:recipientId/unread`,
    ({ params }) => {
      const notification = mockNotifications.find((n) => n.id === params.recipientId);
      if (!notification) {
        return HttpResponse.json(
          { error_code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
          { status: 404 },
        );
      }
      notification.is_read = false;
      notification.read_at = null;
      return new HttpResponse(null, { status: 204 });
    },
  ),

  // Mark all as read (workspace-scoped)
  http.post(`${API_URL}/workspaces/:workspaceId/notifications/mark-all-read`, ({ params }) => {
    const workspaceNotifications = mockNotifications.filter(
      (n) => n.workspace_id === params.workspaceId,
    );
    let count = 0;
    const now = new Date().toISOString();
    workspaceNotifications.forEach((n) => {
      if (!n.is_read) {
        n.is_read = true;
        n.read_at = now;
        count++;
      }
    });
    return HttpResponse.json({
      data: { count },
    });
  }),

  // Mark all as read (global)
  http.post(`${API_URL}/users/me/notifications/mark-all-read`, () => {
    let count = 0;
    const now = new Date().toISOString();
    mockNotifications.forEach((n) => {
      if (!n.is_read) {
        n.is_read = true;
        n.read_at = now;
        count++;
      }
    });
    return HttpResponse.json({
      data: { count },
    });
  }),

  // Delete notification
  http.delete(`${API_URL}/workspaces/:workspaceId/notifications/:recipientId`, ({ params }) => {
    mockNotifications = mockNotifications.filter((n) => n.id !== params.recipientId);
    return new HttpResponse(null, { status: 204 });
  }),

  // Get notification preferences
  http.get(`${API_URL}/users/me/notification-preferences`, () => {
    return HttpResponse.json({
      data: mockPreferences,
    });
  }),

  // Update notification preference
  http.put(`${API_URL}/users/me/notification-preferences`, async ({ request }) => {
    const body = (await request.json()) as {
      channel: 'in_app' | 'email';
      enabled: boolean;
      workspace_id?: string;
      notification_type?: string;
    };

    // Find existing preference or create new one
    const existing = mockPreferences.find(
      (p) =>
        p.channel === body.channel &&
        p.workspace_id === (body.workspace_id || null) &&
        p.notification_type === (body.notification_type || null),
    );

    if (existing) {
      existing.enabled = body.enabled;
      return HttpResponse.json({
        data: existing,
      });
    } else {
      const newPref: MockNotificationPreference = {
        id: `pref-${Date.now()}`,
        channel: body.channel,
        enabled: body.enabled,
        workspace_id: body.workspace_id || null,
        notification_type: body.notification_type || null,
      };
      mockPreferences.push(newPref);
      return HttpResponse.json({
        data: newPref,
      });
    }
  }),

  // Get notification types
  http.get(`${API_URL}/users/me/notification-types`, () => {
    return HttpResponse.json({
      data: mockTypes,
    });
  }),
];
