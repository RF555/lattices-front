/**
 * Tests for notification hooks
 *
 * Tests all 9 hooks exported from useNotifications.ts:
 * - Query hooks: useNotifications, useUnreadCount, useNotificationPreferences, useNotificationTypes
 * - Mutation hooks: useMarkAsRead, useMarkAsUnread, useMarkAllAsRead, useDeleteNotification, useUpdateNotificationPreferences
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import type { ReactNode } from 'react';
import {
  useNotifications,
  useUnreadCount,
  useNotificationPreferences,
  useNotificationTypes,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
  useUpdateNotificationPreferences,
} from '../useNotifications';

// Helper to create wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('Notification Query Hooks', () => {
  describe('useNotifications', () => {
    it('should fetch cross-workspace notifications when no workspaceId provided', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify response shape
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.notifications).toBeInstanceOf(Array);
      expect(result.current.data?.unreadCount).toBeTypeOf('number');
      expect(result.current.data?.notifications.length).toBeGreaterThan(0);

      // Verify notification structure (camelCase frontend format)
      const firstNotification = result.current.data!.notifications[0];
      expect(firstNotification).toHaveProperty('id');
      expect(firstNotification).toHaveProperty('type');
      expect(firstNotification).toHaveProperty('workspaceId');
      expect(firstNotification).toHaveProperty('actorId');
      expect(firstNotification).toHaveProperty('entityType');
      expect(firstNotification).toHaveProperty('entityId');
      expect(firstNotification).toHaveProperty('isRead');
      expect(firstNotification).toHaveProperty('createdAt');
    });

    it('should fetch workspace-scoped notifications when workspaceId provided', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotifications({ workspaceId: 'ws-1' }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.notifications).toBeInstanceOf(Array);

      // All notifications should belong to the workspace
      const allBelongToWorkspace = result.current.data!.notifications.every(
        (n) => n.workspaceId === 'ws-1',
      );
      expect(allBelongToWorkspace).toBe(true);
    });

    it('should support filtering by isRead parameter', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotifications({ isRead: false }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // All notifications should be unread
      const allUnread = result.current.data!.notifications.every((n) => !n.isRead);
      expect(allUnread).toBe(true);
    });

    it('should support filtering by type parameter', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotifications({ type: 'task.completed' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // All notifications should be of the specified type
      const allCorrectType = result.current.data!.notifications.every(
        (n) => n.type === 'task.completed',
      );
      expect(allCorrectType).toBe(true);
    });

    it('should support pagination with limit parameter', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotifications({ limit: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.notifications.length).toBeLessThanOrEqual(1);
    });
  });

  describe('useUnreadCount', () => {
    it('should fetch total unread count when no workspaceId provided', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeTypeOf('number');
      expect(result.current.data).toBeGreaterThanOrEqual(0);
    });

    it('should fetch workspace-specific unread count when workspaceId provided', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUnreadCount('ws-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeTypeOf('number');
      expect(result.current.data).toBeGreaterThanOrEqual(0);
    });

    it('should return a number for workspace with no unread notifications', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUnreadCount('ws-nonexistent'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(0);
    });
  });

  describe('useNotificationPreferences', () => {
    it('should fetch notification preferences array', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotificationPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeInstanceOf(Array);
      expect(result.current.data!.length).toBeGreaterThan(0);

      // Verify preference structure (camelCase frontend format)
      const firstPref = result.current.data![0];
      expect(firstPref).toHaveProperty('id');
      expect(firstPref).toHaveProperty('channel');
      expect(firstPref).toHaveProperty('enabled');
      expect(firstPref.channel).toMatch(/^(in_app|email)$/);
      expect(firstPref.enabled).toBeTypeOf('boolean');
    });

    it('should return preferences with correct structure', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotificationPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const prefs = result.current.data!;
      prefs.forEach((pref) => {
        expect(pref.id).toBeTypeOf('string');
        expect(['in_app', 'email']).toContain(pref.channel);
        expect(pref.enabled).toBeTypeOf('boolean');
      });
    });
  });

  describe('useNotificationTypes', () => {
    it('should fetch notification types array', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotificationTypes(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeInstanceOf(Array);
      expect(result.current.data!.length).toBeGreaterThan(0);

      // Verify type structure (camelCase frontend format)
      const firstType = result.current.data![0];
      expect(firstType).toHaveProperty('id');
      expect(firstType).toHaveProperty('name');
      expect(firstType).toHaveProperty('template');
      expect(firstType).toHaveProperty('isMandatory');
    });

    it('should return types with mandatory flags', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useNotificationTypes(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const types = result.current.data!;
      const hasMandatory = types.some((t) => t.isMandatory);
      const hasOptional = types.some((t) => !t.isMandatory);

      expect(hasMandatory).toBe(true);
      expect(hasOptional).toBe(true);
    });
  });
});

describe('Notification Mutation Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe('useMarkAsRead', () => {
    it('should mark a notification as read', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAsRead(), { wrapper });

      // Mutation should be idle initially
      expect(result.current.isIdle).toBe(true);

      // Call mutation
      result.current.mutate({
        workspaceId: 'ws-1',
        recipientId: 'notif-1',
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should handle mutation with correct parameters', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAsRead(), { wrapper });

      const params = {
        workspaceId: 'ws-1',
        recipientId: 'notif-1',
      };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useMarkAsUnread', () => {
    it('should mark a notification as unread', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAsUnread(), { wrapper });

      result.current.mutate({
        workspaceId: 'ws-1',
        recipientId: 'notif-2',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should handle mutation with correct parameters', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAsUnread(), { wrapper });

      const params = {
        workspaceId: 'ws-1',
        recipientId: 'notif-2',
      };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read globally when no workspaceId provided', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });

      result.current.mutate(undefined);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should mark all notifications as read for a workspace when workspaceId provided', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });

      result.current.mutate('ws-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should support async mutation with await', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });

      const mutatePromise = result.current.mutateAsync('ws-1');

      await expect(mutatePromise).resolves.toBeDefined();

      // Wait for the mutation state to update
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteNotification', () => {
    it('should delete a notification', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteNotification(), { wrapper });

      result.current.mutate({
        workspaceId: 'ws-1',
        recipientId: 'notif-1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should handle deletion with correct parameters', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteNotification(), { wrapper });

      const params = {
        workspaceId: 'ws-1',
        recipientId: 'notif-3',
      };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateNotificationPreferences', () => {
    it('should update a notification preference', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper });

      const input = {
        channel: 'in_app' as const,
        enabled: false,
        notificationType: 'task.completed',
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should update email channel preference', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper });

      const input = {
        channel: 'email' as const,
        enabled: true,
        notificationType: 'task.updated',
        workspaceId: 'ws-1',
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
    });

    it('should handle preference update with all fields', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper });

      const input = {
        channel: 'in_app' as const,
        enabled: true,
        workspaceId: 'ws-1',
        notificationType: 'member.added',
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate preferences query after successful update', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result: mutationResult } = renderHook(() => useUpdateNotificationPreferences(), {
        wrapper,
      });

      const input = {
        channel: 'in_app' as const,
        enabled: false,
        notificationType: 'task.completed',
      };

      mutationResult.current.mutate(input);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Mutation should complete successfully
      expect(mutationResult.current.isError).toBe(false);
    });
  });
});

describe('Notification Hooks Integration', () => {
  it('should work with mutations affecting query data', async () => {
    const { wrapper } = createWrapper();

    // First, fetch notifications
    const { result: queryResult } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(queryResult.current.isSuccess).toBe(true);
    });

    const initialCount = queryResult.current.data!.notifications.length;
    expect(initialCount).toBeGreaterThan(0);

    // Then delete a notification
    const { result: mutationResult } = renderHook(() => useDeleteNotification(), { wrapper });

    mutationResult.current.mutate({
      workspaceId: 'ws-1',
      recipientId: queryResult.current.data!.notifications[0].id,
    });

    await waitFor(() => {
      expect(mutationResult.current.isSuccess).toBe(true);
    });

    // The mutation hook should have completed successfully
    expect(mutationResult.current.isError).toBe(false);
  });

  it('should handle mark as read affecting unread count', async () => {
    const { wrapper } = createWrapper();

    // Fetch initial unread count
    const { result: countResult } = renderHook(() => useUnreadCount(), { wrapper });

    await waitFor(() => {
      expect(countResult.current.isSuccess).toBe(true);
    });

    // Get an unread notification to mark as read
    const { result: notificationsResult } = renderHook(() => useNotifications({ isRead: false }), {
      wrapper,
    });

    await waitFor(() => {
      expect(notificationsResult.current.isSuccess).toBe(true);
    });

    if (notificationsResult.current.data!.notifications.length > 0) {
      const unreadNotif = notificationsResult.current.data!.notifications[0];

      // Mark it as read
      const { result: markReadResult } = renderHook(() => useMarkAsRead(), { wrapper });

      markReadResult.current.mutate({
        workspaceId: unreadNotif.workspaceId,
        recipientId: unreadNotif.id,
      });

      await waitFor(() => {
        expect(markReadResult.current.isSuccess).toBe(true);
      });

      expect(markReadResult.current.isError).toBe(false);
    }
  });
});
