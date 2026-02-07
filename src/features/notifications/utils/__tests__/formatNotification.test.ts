import { describe, it, expect, vi } from 'vitest';
import { formatNotificationMessage, getEntityRoute, getActorInitials } from '../formatNotification';
import { createMockNotification } from '@/test/factories';
import type { TFunction } from 'i18next';

describe('formatNotificationMessage', () => {
  // Mock t function that simulates i18n template interpolation
  const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
    const templates: Record<string, string> = {
      'type.task.completed': '{{actorName}} completed "{{entityTitle}}"',
      'type.task.updated': '{{actorName}} updated "{{entityTitle}}"',
      'type.task.created': '{{actorName}} created "{{entityTitle}}"',
      'type.task.deleted': '{{actorName}} deleted "{{entityTitle}}"',
      'type.member.added': '{{actorName}} added you to "{{workspaceName}}"',
      'type.member.removed': 'You were removed from "{{workspaceName}}"',
      'type.member.role_changed': 'Your role in "{{workspaceName}}" was changed to {{newRole}}',
      'type.invitation.received': '{{actorName}} invited you to join "{{workspaceName}}"',
      'type.invitation.accepted': '{{actorName}} accepted your invitation to "{{workspaceName}}"',
      'type.group.member_added': '{{actorName}} added you to group "{{groupName}}"',
      unknownActor: 'Someone',
      unknownEntity: 'an item',
      unknownWorkspace: 'a workspace',
    };

    let result = templates[key] ?? options?.defaultValue ?? key;

    // Simple template interpolation
    if (typeof result === 'string' && options) {
      Object.entries(options).forEach(([k, v]) => {
        if (typeof v === 'string') {
          result = (result as string).replace(new RegExp(`{{${k}}}`, 'g'), v);
        }
      });
    }

    return result;
  }) as unknown as TFunction<'notifications'>;

  it('should format task.completed notification', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: 'John Doe',
        entityTitle: 'Fix bug #123',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('John Doe completed "Fix bug #123"');
  });

  it('should format task.updated notification', () => {
    const notification = createMockNotification({
      type: 'task.updated',
      metadata: {
        actorName: 'Alice',
        entityTitle: 'Update documentation',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Alice updated "Update documentation"');
  });

  it('should format task.created notification', () => {
    const notification = createMockNotification({
      type: 'task.created',
      metadata: {
        actorName: 'Bob',
        entityTitle: 'New feature',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Bob created "New feature"');
  });

  it('should format task.deleted notification', () => {
    const notification = createMockNotification({
      type: 'task.deleted',
      metadata: {
        actorName: 'Carol',
        entityTitle: 'Old task',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Carol deleted "Old task"');
  });

  it('should format member.added notification', () => {
    const notification = createMockNotification({
      type: 'member.added',
      metadata: {
        actorName: 'David',
        workspaceName: 'Team Workspace',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('David added you to "Team Workspace"');
  });

  it('should format member.removed notification', () => {
    const notification = createMockNotification({
      type: 'member.removed',
      metadata: {
        workspaceName: 'Old Workspace',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('You were removed from "Old Workspace"');
  });

  it('should format member.role_changed notification', () => {
    const notification = createMockNotification({
      type: 'member.role_changed',
      metadata: {
        workspaceName: 'My Workspace',
        newRole: 'admin',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Your role in "My Workspace" was changed to admin');
  });

  it('should format invitation.received notification', () => {
    const notification = createMockNotification({
      type: 'invitation.received',
      metadata: {
        actorName: 'Eve',
        workspaceName: 'New Project',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Eve invited you to join "New Project"');
  });

  it('should format invitation.accepted notification', () => {
    const notification = createMockNotification({
      type: 'invitation.accepted',
      metadata: {
        actorName: 'Frank',
        workspaceName: 'Collaboration Space',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Frank accepted your invitation to "Collaboration Space"');
  });

  it('should format group.member_added notification', () => {
    const notification = createMockNotification({
      type: 'group.member_added',
      metadata: {
        actorName: 'Grace',
        groupName: 'Developers',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Grace added you to group "Developers"');
  });

  it('should use fallback for missing actorName', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: undefined,
        entityTitle: 'Test Task',
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Someone completed "Test Task"');
  });

  it('should use fallback for missing entityTitle', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: 'John',
        entityTitle: undefined,
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('John completed "an item"');
  });

  it('should use fallback for missing workspaceName', () => {
    const notification = createMockNotification({
      type: 'member.added',
      metadata: {
        actorName: 'Alice',
        workspaceName: undefined,
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Alice added you to "a workspace"');
  });

  it('should handle all missing metadata gracefully', () => {
    const notification = createMockNotification({
      type: 'task.completed',
      metadata: {
        actorName: undefined,
        entityTitle: undefined,
      },
    });

    const result = formatNotificationMessage(notification, mockT);
    expect(result).toBe('Someone completed "an item"');
  });
});

describe('getEntityRoute', () => {
  it('should return app route for todo entity', () => {
    const notification = createMockNotification({
      entityType: 'todo',
      entityId: 'todo-123',
      workspaceId: 'ws-1',
    });

    const route = getEntityRoute(notification);
    expect(route).toBe('/app');
  });

  it('should return workspace settings route for workspace entity', () => {
    const notification = createMockNotification({
      entityType: 'workspace',
      entityId: 'ws-123',
      workspaceId: 'ws-123',
    });

    const route = getEntityRoute(notification);
    expect(route).toBe('/app/workspaces/ws-123/settings');
  });

  it('should return app route for invitation entity', () => {
    const notification = createMockNotification({
      entityType: 'invitation',
      entityId: 'inv-123',
      workspaceId: 'ws-1',
    });

    const route = getEntityRoute(notification);
    expect(route).toBe('/app');
  });

  it('should return group route for group entity', () => {
    const notification = createMockNotification({
      entityType: 'group',
      entityId: 'grp-123',
      workspaceId: 'ws-1',
    });

    const route = getEntityRoute(notification);
    expect(route).toBe('/app/workspaces/ws-1/groups/grp-123');
  });

  it('should return default app route for unknown entity type', () => {
    const notification = createMockNotification({
      entityType: 'unknown',
      entityId: 'unknown-123',
      workspaceId: 'ws-1',
    });

    const route = getEntityRoute(notification);
    expect(route).toBe('/app');
  });
});

describe('getActorInitials', () => {
  it('should return first 2 characters of actor name in uppercase', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'John Doe',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('JO');
  });

  it('should handle single character names', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'A',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('A');
  });

  it('should handle names with special characters', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'Élise Martin',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('ÉL');
  });

  it('should return "?" when actor name is missing', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: undefined,
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('?');
  });

  it('should return "?" when actor name is empty string', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: '',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('?');
  });

  it('should handle lowercase names', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'alice smith',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('AL');
  });

  it('should truncate long names to 2 characters', () => {
    const notification = createMockNotification({
      metadata: {
        actorName: 'Alexander',
      },
    });

    const initials = getActorInitials(notification);
    expect(initials).toBe('AL');
  });
});
