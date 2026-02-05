import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { notificationApi } from '../api/notificationApi';
import type {
  NotificationListResult,
} from '../types/notification';

// ── Query Hooks ────────────────────────────────────────────────────────

interface UseNotificationsOptions {
  workspaceId?: string;
  isRead?: boolean;
  type?: string;
  cursor?: string;
  limit?: number;
}

/** Fetch notification list (workspace-scoped or cross-workspace) */
export function useNotifications(options?: UseNotificationsOptions) {
  const { workspaceId, isRead, type, cursor, limit } = options ?? {};
  const filters = { workspaceId, isRead, type, cursor, limit };

  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => {
      const params = {
        is_read: isRead,
        type,
        cursor,
        limit,
      };
      return workspaceId
        ? notificationApi.getForWorkspace(workspaceId, params)
        : notificationApi.getAll(params);
    },
    staleTime: 2 * 60 * 1000, // 2 min — Supabase Realtime handles freshness
  });
}

/** Get unread count for a specific workspace */
export function useUnreadCount(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceId
      ? queryKeys.notifications.unreadCount(workspaceId)
      : queryKeys.notifications.totalUnreadCount(),
    queryFn: () =>
      workspaceId
        ? notificationApi.getUnreadCount(workspaceId)
        : notificationApi.getTotalUnreadCount(),
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // 1 min polling as safety net
  });
}

// ── Mutation Hooks ─────────────────────────────────────────────────────

/** Mark a single notification as read with optimistic update */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, recipientId }: { workspaceId: string; recipientId: string }) =>
      notificationApi.markRead(workspaceId, recipientId),

    onMutate: async ({ recipientId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      // Snapshot all notification list queries
      const previousLists = queryClient.getQueriesData<NotificationListResult>({
        queryKey: queryKeys.notifications.lists(),
      });

      // Optimistic: set isRead = true in all cached lists
      for (const [key, data] of previousLists) {
        if (data?.notifications) {
          queryClient.setQueryData<NotificationListResult>(key, {
            ...data,
            unreadCount: Math.max(0, data.unreadCount - 1),
            notifications: data.notifications.map((n) =>
              n.id === recipientId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            ),
          });
        }
      }

      // Decrement unread counts
      const previousCounts = decrementUnreadCounts(queryClient);

      return { previousLists, previousCounts };
    },

    onError: (_, __, context) => {
      // Rollback lists
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      // Rollback counts
      if (context?.previousCounts) {
        for (const [key, data] of context.previousCounts) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Mark a single notification as unread with optimistic update */
export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, recipientId }: { workspaceId: string; recipientId: string }) =>
      notificationApi.markUnread(workspaceId, recipientId),

    onMutate: async ({ recipientId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousLists = queryClient.getQueriesData<NotificationListResult>({
        queryKey: queryKeys.notifications.lists(),
      });

      for (const [key, data] of previousLists) {
        if (data?.notifications) {
          queryClient.setQueryData<NotificationListResult>(key, {
            ...data,
            unreadCount: data.unreadCount + 1,
            notifications: data.notifications.map((n) =>
              n.id === recipientId ? { ...n, isRead: false, readAt: null } : n
            ),
          });
        }
      }

      const previousCounts = incrementUnreadCounts(queryClient);

      return { previousLists, previousCounts };
    },

    onError: (_, __, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCounts) {
        for (const [key, data] of context.previousCounts) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Mark all notifications as read (workspace-scoped or global) */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId?: string) =>
      workspaceId
        ? notificationApi.markAllRead(workspaceId)
        : notificationApi.markAllReadGlobal(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousLists = queryClient.getQueriesData<NotificationListResult>({
        queryKey: queryKeys.notifications.lists(),
      });

      // Set all to read
      for (const [key, data] of previousLists) {
        if (data?.notifications) {
          queryClient.setQueryData<NotificationListResult>(key, {
            ...data,
            unreadCount: 0,
            notifications: data.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: n.readAt ?? new Date().toISOString(),
            })),
          });
        }
      }

      // Zero out all unread count queries
      const previousCounts = zeroUnreadCounts(queryClient);

      return { previousLists, previousCounts };
    },

    onError: (_, __, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCounts) {
        for (const [key, data] of context.previousCounts) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Soft-delete a notification with optimistic update */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, recipientId }: { workspaceId: string; recipientId: string }) =>
      notificationApi.remove(workspaceId, recipientId),

    onMutate: async ({ recipientId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousLists = queryClient.getQueriesData<NotificationListResult>({
        queryKey: queryKeys.notifications.lists(),
      });

      let wasUnread = false;

      for (const [key, data] of previousLists) {
        if (data?.notifications) {
          const target = data.notifications.find((n) => n.id === recipientId);
          if (target && !target.isRead) wasUnread = true;

          queryClient.setQueryData<NotificationListResult>(key, {
            ...data,
            unreadCount: wasUnread ? Math.max(0, data.unreadCount - 1) : data.unreadCount,
            notifications: data.notifications.filter((n) => n.id !== recipientId),
          });
        }
      }

      const previousCounts = wasUnread
        ? decrementUnreadCounts(queryClient)
        : snapshotUnreadCounts(queryClient);

      return { previousLists, previousCounts };
    },

    onError: (_, __, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCounts) {
        for (const [key, data] of context.previousCounts) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ── Preference Hooks ───────────────────────────────────────────────────

/** Get user's notification preferences */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationApi.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Update a notification preference */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.updatePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences() });
    },
  });
}

/** Get available notification types (for preferences UI) */
export function useNotificationTypes() {
  return useQuery({
    queryKey: queryKeys.notifications.types(),
    queryFn: () => notificationApi.getTypes(),
    staleTime: Infinity, // Types rarely change
  });
}

// ── Helpers ────────────────────────────────────────────────────────────

type CountSnapshot = [readonly unknown[], number | undefined][];

function snapshotUnreadCounts(
  queryClient: ReturnType<typeof useQueryClient>
): CountSnapshot {
  return queryClient
    .getQueriesData<number>({ queryKey: [...queryKeys.notifications.all, 'unread-count'] })
    .concat(
      queryClient.getQueriesData<number>({
        queryKey: queryKeys.notifications.totalUnreadCount(),
      })
    );
}

function decrementUnreadCounts(
  queryClient: ReturnType<typeof useQueryClient>
): CountSnapshot {
  const snapshot = snapshotUnreadCounts(queryClient);
  for (const [key, count] of snapshot) {
    if (typeof count === 'number') {
      queryClient.setQueryData<number>(key, Math.max(0, count - 1));
    }
  }
  return snapshot;
}

function incrementUnreadCounts(
  queryClient: ReturnType<typeof useQueryClient>
): CountSnapshot {
  const snapshot = snapshotUnreadCounts(queryClient);
  for (const [key, count] of snapshot) {
    if (typeof count === 'number') {
      queryClient.setQueryData<number>(key, count + 1);
    }
  }
  return snapshot;
}

function zeroUnreadCounts(
  queryClient: ReturnType<typeof useQueryClient>
): CountSnapshot {
  const snapshot = snapshotUnreadCounts(queryClient);
  for (const [key, count] of snapshot) {
    if (typeof count === 'number') {
      queryClient.setQueryData<number>(key, 0);
    }
  }
  return snapshot;
}
