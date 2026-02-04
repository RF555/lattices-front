import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { notificationApi } from '../api/notificationApi';
import type { Notification, NotificationPreferences } from '../types/notification';

export function useNotifications(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(options),
    queryFn: () => notificationApi.getNotifications(options?.limit, options?.offset),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueriesData<Notification[]>({
        queryKey: queryKeys.notifications.all,
      });

      for (const [queryKey, data] of previousNotifications) {
        if (Array.isArray(data)) {
          queryClient.setQueryData<Notification[]>(
            queryKey,
            data.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
          );
        }
      }

      return { previousNotifications };
    },

    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        for (const [queryKey, data] of context.previousNotifications) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationApi.getPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      notificationApi.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences() });
    },
  });
}
