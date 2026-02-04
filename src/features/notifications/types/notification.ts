// ── API Response Types (snake_case from backend) ───────────────────────

export interface NotificationApiResponse {
  id: string; // notification_recipient.id
  notification_id: string;
  type: string; // e.g. "task.completed"
  workspace_id: string;
  actor_id: string;
  entity_type: string; // "todo", "workspace", "invitation", "group"
  entity_id: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListApiResponse {
  data: NotificationApiResponse[];
  meta: {
    unread_count: number;
    next_cursor: string | null;
  };
}

export interface UnreadCountApiResponse {
  data: { count: number };
}

export interface MarkAllReadApiResponse {
  data: { count: number };
}

export interface NotificationTypeApiResponse {
  id: string;
  name: string;
  description: string | null;
  template: string;
  is_mandatory: boolean;
}

export interface NotificationPreferenceApiResponse {
  id: string;
  channel: 'in_app' | 'email';
  enabled: boolean;
  workspace_id: string | null;
  notification_type: string | null;
}

// ── Frontend Types (camelCase) ─────────────────────────────────────────

export interface Notification {
  id: string; // notification_recipient.id (used for mark-read / delete)
  notificationId: string;
  type: string;
  workspaceId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  metadata: NotificationMetadata;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationMetadata {
  actorName?: string;
  actorAvatarUrl?: string;
  entityTitle?: string;
  workspaceName?: string;
  oldRole?: string;
  newRole?: string;
  groupName?: string;
  changesSummary?: string;
  [key: string]: unknown;
}

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface NotificationType {
  id: string;
  name: string;
  description: string | null;
  template: string;
  isMandatory: boolean;
}

export interface NotificationPreference {
  id: string;
  channel: 'in_app' | 'email';
  enabled: boolean;
  workspaceId: string | null;
  notificationType: string | null;
}

export interface NotificationPreferenceInput {
  channel: 'in_app' | 'email';
  enabled: boolean;
  workspaceId?: string;
  notificationType?: string;
}

// ── Notification Type Constants ────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  TASK_COMPLETED: 'task.completed',
  TASK_UPDATED: 'task.updated',
  TASK_CREATED: 'task.created',
  TASK_DELETED: 'task.deleted',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  INVITATION_RECEIVED: 'invitation.received',
  INVITATION_ACCEPTED: 'invitation.accepted',
  GROUP_MEMBER_ADDED: 'group.member_added',
} as const;

// Category grouping for preferences UI
export const NOTIFICATION_CATEGORIES = {
  task: [
    NOTIFICATION_TYPES.TASK_COMPLETED,
    NOTIFICATION_TYPES.TASK_UPDATED,
    NOTIFICATION_TYPES.TASK_CREATED,
    NOTIFICATION_TYPES.TASK_DELETED,
  ],
  workspace: [
    NOTIFICATION_TYPES.MEMBER_ADDED,
    NOTIFICATION_TYPES.MEMBER_REMOVED,
    NOTIFICATION_TYPES.MEMBER_ROLE_CHANGED,
  ],
  invitation: [
    NOTIFICATION_TYPES.INVITATION_RECEIVED,
    NOTIFICATION_TYPES.INVITATION_ACCEPTED,
  ],
  group: [NOTIFICATION_TYPES.GROUP_MEMBER_ADDED],
} as const;

// Types that are mandatory (cannot be turned off)
export const MANDATORY_NOTIFICATION_TYPES = new Set([
  NOTIFICATION_TYPES.MEMBER_ADDED,
  NOTIFICATION_TYPES.MEMBER_REMOVED,
  NOTIFICATION_TYPES.MEMBER_ROLE_CHANGED,
  NOTIFICATION_TYPES.INVITATION_RECEIVED,
]);
