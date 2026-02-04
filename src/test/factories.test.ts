/**
 * Test for Factory Functions
 *
 * Verifies that all factory functions create valid mock objects
 * with the correct structure and default values.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockWorkspace,
  createMockMember,
  createMockInvitation,
  createMockNotification,
  createMockGroup,
  createMockGroupMember,
  createMockActivityEntry,
  createMockNotificationPreferences,
  resetFactoryCounters,
} from './factories';

describe('Factory Functions', () => {
  beforeEach(() => {
    resetFactoryCounters();
  });

  describe('createMockWorkspace', () => {
    it('should create a workspace with default values', () => {
      const workspace = createMockWorkspace();

      expect(workspace).toHaveProperty('id');
      expect(workspace).toHaveProperty('name');
      expect(workspace).toHaveProperty('slug');
      expect(workspace).toHaveProperty('description');
      expect(workspace).toHaveProperty('createdBy');
      expect(workspace).toHaveProperty('memberCount');
      expect(workspace).toHaveProperty('createdAt');
      expect(workspace).toHaveProperty('updatedAt');
    });

    it('should allow overriding default values', () => {
      const workspace = createMockWorkspace({
        name: 'Custom Workspace',
        memberCount: 10,
      });

      expect(workspace.name).toBe('Custom Workspace');
      expect(workspace.memberCount).toBe(10);
    });

    it('should generate unique IDs', () => {
      const workspace1 = createMockWorkspace();
      const workspace2 = createMockWorkspace();

      expect(workspace1.id).not.toBe(workspace2.id);
    });
  });

  describe('createMockMember', () => {
    it('should create a member with default values', () => {
      const member = createMockMember();

      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('displayName');
      expect(member).toHaveProperty('avatarUrl');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('joinedAt');
    });

    it('should allow overriding role', () => {
      const member = createMockMember({ role: 'admin' });

      expect(member.role).toBe('admin');
    });

    it('should generate unique user IDs and emails', () => {
      const member1 = createMockMember();
      const member2 = createMockMember();

      expect(member1.userId).not.toBe(member2.userId);
      expect(member1.email).not.toBe(member2.email);
    });
  });

  describe('createMockInvitation', () => {
    it('should create an invitation with default values', () => {
      const invitation = createMockInvitation();

      expect(invitation).toHaveProperty('id');
      expect(invitation).toHaveProperty('workspaceId');
      expect(invitation).toHaveProperty('workspaceName');
      expect(invitation).toHaveProperty('email');
      expect(invitation).toHaveProperty('role');
      expect(invitation).toHaveProperty('invitedByName');
      expect(invitation).toHaveProperty('status');
      expect(invitation).toHaveProperty('createdAt');
      expect(invitation).toHaveProperty('expiresAt');
    });

    it('should default to pending status', () => {
      const invitation = createMockInvitation();

      expect(invitation.status).toBe('pending');
    });

    it('should allow overriding status', () => {
      const invitation = createMockInvitation({ status: 'accepted' });

      expect(invitation.status).toBe('accepted');
    });
  });

  describe('createMockNotification', () => {
    it('should create a notification with default values', () => {
      const notification = createMockNotification();

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('actorName');
      expect(notification).toHaveProperty('actorAvatarUrl');
      expect(notification).toHaveProperty('entityType');
      expect(notification).toHaveProperty('entityId');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('isRead');
      expect(notification).toHaveProperty('isSeen');
      expect(notification).toHaveProperty('createdAt');
    });

    it('should default to unread', () => {
      const notification = createMockNotification();

      expect(notification.isRead).toBe(false);
      expect(notification.isSeen).toBe(false);
    });

    it('should allow overriding read status', () => {
      const notification = createMockNotification({ isRead: true, isSeen: true });

      expect(notification.isRead).toBe(true);
      expect(notification.isSeen).toBe(true);
    });
  });

  describe('createMockGroup', () => {
    it('should create a group with default values', () => {
      const group = createMockGroup();

      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('workspaceId');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('memberCount');
      expect(group).toHaveProperty('createdAt');
    });

    it('should allow overriding values', () => {
      const group = createMockGroup({
        name: 'Custom Group',
        memberCount: 5,
      });

      expect(group.name).toBe('Custom Group');
      expect(group.memberCount).toBe(5);
    });
  });

  describe('createMockGroupMember', () => {
    it('should create a group member with default values', () => {
      const member = createMockGroupMember();

      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('displayName');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('avatarUrl');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('joinedAt');
    });

    it('should assign admin role to first member', () => {
      const member1 = createMockGroupMember();
      const member2 = createMockGroupMember();

      expect(member1.role).toBe('admin');
      expect(member2.role).toBe('member');
    });
  });

  describe('createMockActivityEntry', () => {
    it('should create an activity entry with default values', () => {
      const entry = createMockActivityEntry();

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('actorId');
      expect(entry).toHaveProperty('actorName');
      expect(entry).toHaveProperty('actorAvatarUrl');
      expect(entry).toHaveProperty('action');
      expect(entry).toHaveProperty('entityType');
      expect(entry).toHaveProperty('entityId');
      expect(entry).toHaveProperty('entityTitle');
      expect(entry).toHaveProperty('changes');
      expect(entry).toHaveProperty('createdAt');
    });

    it('should cycle through different actions', () => {
      const entry1 = createMockActivityEntry();
      const entry2 = createMockActivityEntry();
      const entry3 = createMockActivityEntry();

      // Should cycle through actions array
      expect([entry1.action, entry2.action, entry3.action]).toContain('created');
    });

    it('should allow specifying changes', () => {
      const entry = createMockActivityEntry({
        changes: { status: { old: 'pending', new: 'completed' } },
      });

      expect(entry.changes).toEqual({ status: { old: 'pending', new: 'completed' } });
    });
  });

  describe('createMockNotificationPreferences', () => {
    it('should create notification preferences with default values', () => {
      const prefs = createMockNotificationPreferences();

      expect(prefs).toHaveProperty('workspace_invitation');
      expect(prefs).toHaveProperty('task_assigned');
      expect(prefs).toHaveProperty('task_completed');
      expect(prefs).toHaveProperty('task_commented');
      expect(prefs).toHaveProperty('member_added');

      expect(prefs.workspace_invitation).toEqual({ inApp: true, email: true });
      expect(prefs.task_assigned).toEqual({ inApp: true, email: true });
    });

    it('should allow overriding preferences', () => {
      const prefs = createMockNotificationPreferences({
        task_completed: { inApp: false, email: false },
      });

      expect(prefs.task_completed).toEqual({ inApp: false, email: false });
    });
  });

  describe('resetFactoryCounters', () => {
    it('should reset all counters', () => {
      // Create some objects to increment counters
      createMockWorkspace();
      createMockWorkspace();
      createMockMember();
      createMockMember();

      // Reset
      resetFactoryCounters();

      // New objects should have ID 1
      const workspace = createMockWorkspace();
      const member = createMockMember();

      expect(workspace.id).toBe('ws-1');
      expect(member.userId).toBe('user-1');
    });
  });
});
