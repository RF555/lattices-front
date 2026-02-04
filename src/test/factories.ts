/**
 * Test Factories
 *
 * Factory functions for creating mock data objects for testing.
 * All factories return objects in camelCase (frontend format), not snake_case (API format).
 *
 * Usage:
 *   import { createMockWorkspace, createMockMember } from '@/test/factories'
 *   const workspace = createMockWorkspace({ name: 'Custom Name' })
 */

import type { Workspace, WorkspaceMember, Invitation, WorkspaceRole } from '@/features/workspaces/types/workspace';
import type { ActivityEntry } from '@/features/workspaces/types/activity';
import type { Group, GroupMember } from '@/features/workspaces/types/group';
import type { Notification, NotificationPreference } from '@/features/notifications/types/notification';

// Helper functions for timestamps
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

let workspaceIdCounter = 1;
let memberIdCounter = 1;
let invitationIdCounter = 1;
let activityIdCounter = 1;
let groupIdCounter = 1;
let groupMemberIdCounter = 1;
let notificationIdCounter = 1;

/**
 * Creates a mock workspace with default values that can be overridden
 */
export function createMockWorkspace(overrides?: Partial<Workspace>): Workspace {
  const id = `ws-${workspaceIdCounter++}`;
  return {
    id,
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: 'A test workspace for unit testing',
    createdBy: 'user-1',
    memberCount: 3,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

/**
 * Creates a mock workspace member with default values that can be overridden
 */
export function createMockMember(overrides?: Partial<WorkspaceMember>): WorkspaceMember {
  const userId = `user-${memberIdCounter++}`;
  const roles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer'];
  const role = overrides?.role || roles[Math.min(memberIdCounter - 1, roles.length - 1)];

  return {
    userId,
    email: `user${memberIdCounter}@example.com`,
    displayName: `Test User ${memberIdCounter}`,
    avatarUrl: null,
    role,
    joinedAt: daysAgo(15),
    ...overrides,
  };
}

/**
 * Creates a mock invitation with default values that can be overridden
 */
export function createMockInvitation(overrides?: Partial<Invitation>): Invitation {
  const id = `inv-${invitationIdCounter++}`;
  return {
    id,
    workspaceId: 'ws-1',
    workspaceName: 'Test Workspace',
    email: `invitee${invitationIdCounter}@example.com`,
    role: 'member',
    invitedByName: 'Test User',
    status: 'pending',
    createdAt: daysAgo(2),
    expiresAt: daysAgo(-5), // expires in 5 days
    ...overrides,
  };
}

/**
 * Creates a mock notification with default values that can be overridden
 */
export function createMockNotification(overrides?: Partial<Notification>): Notification {
  const id = `notif-${notificationIdCounter}`;
  const notificationId = `notif-id-${notificationIdCounter++}`;
  const types = ['task.completed', 'task.updated', 'member.added', 'invitation.received', 'task.created'];
  const type = overrides?.type || types[(notificationIdCounter - 1) % types.length];

  return {
    id,
    notificationId,
    type,
    workspaceId: 'ws-1',
    actorId: 'user-1',
    entityType: 'todo',
    entityId: 'entity-1',
    metadata: {
      actorName: 'Test Actor',
      actorAvatarUrl: null,
      entityTitle: 'Test Task',
    },
    isRead: false,
    readAt: null,
    createdAt: minutesAgo(30),
    ...overrides,
  };
}

/**
 * Creates a mock group with default values that can be overridden
 */
export function createMockGroup(overrides?: Partial<Group>): Group {
  const id = `grp-${groupIdCounter++}`;
  return {
    id,
    workspaceId: 'ws-1',
    name: `Test Group ${groupIdCounter}`,
    description: `A test group for unit testing`,
    memberCount: 2,
    createdAt: daysAgo(10),
    ...overrides,
  };
}

/**
 * Creates a mock group member with default values that can be overridden
 */
export function createMockGroupMember(overrides?: Partial<GroupMember>): GroupMember {
  const currentId = groupMemberIdCounter++;
  const userId = `user-${currentId}`;
  const role = overrides?.role || (currentId === 1 ? 'admin' : 'member');

  return {
    userId,
    displayName: `Group Member ${currentId}`,
    email: `groupmember${currentId}@example.com`,
    avatarUrl: null,
    role,
    joinedAt: daysAgo(8),
    ...overrides,
  };
}

/**
 * Creates a mock activity entry with default values that can be overridden
 */
export function createMockActivityEntry(overrides?: Partial<ActivityEntry>): ActivityEntry {
  const currentId = activityIdCounter++;
  const id = `act-${currentId}`;
  const actions = ['created', 'updated', 'completed', 'deleted', 'added_member', 'removed_member'];
  const action = overrides?.action || actions[(currentId - 1) % actions.length];

  return {
    id,
    actorId: 'user-1',
    actorName: 'Test Actor',
    actorAvatarUrl: null,
    action,
    entityType: 'todo',
    entityId: `entity-${currentId}`,
    entityTitle: `Test Entity ${currentId}`,
    changes: null,
    createdAt: hoursAgo(2),
    ...overrides,
  };
}

/**
 * Creates a mock notification preference with default values that can be overridden
 */
let notificationPreferenceIdCounter = 1;

export function createMockNotificationPreference(
  overrides?: Partial<NotificationPreference>
): NotificationPreference {
  const id = `pref-${notificationPreferenceIdCounter++}`;
  return {
    id,
    channel: 'in_app',
    enabled: true,
    workspaceId: null,
    notificationType: 'task.completed',
    ...overrides,
  };
}

/**
 * Resets all factory counters to their initial values.
 * Useful in beforeEach/afterEach to ensure consistent IDs across tests.
 */
export function resetFactoryCounters(): void {
  workspaceIdCounter = 1;
  memberIdCounter = 1;
  invitationIdCounter = 1;
  activityIdCounter = 1;
  groupIdCounter = 1;
  groupMemberIdCounter = 1;
  notificationIdCounter = 1;
  notificationPreferenceIdCounter = 1;
}
