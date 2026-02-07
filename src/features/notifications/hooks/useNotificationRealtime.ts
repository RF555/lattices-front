import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { realtimeManager } from '@lib/realtime';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useNotificationUiStore } from '../stores/notificationUiStore';
import { useToastStore } from '@stores/toastStore';

// Minimum interval between reconnection-triggered invalidations (prevents burst
// API calls when Supabase Realtime connection flaps with exponential backoff).
const RECONNECT_INVALIDATION_COOLDOWN_MS = 30_000; // 30 seconds

/**
 * Subscribe to Supabase Realtime for notification delivery.
 *
 * On INSERT to `notification_recipients` for the current user:
 * - Directly increments the unread count cache (instant badge update)
 * - Invalidates notification list (lazy refetch when panel is open)
 * - Optionally shows a toast notification
 *
 * Connection handling:
 * - On reconnect, invalidates all notification queries to catch missed events
 *   (with a 30s cooldown to prevent burst invalidation from connection flapping)
 * - On channel error, enables 30s fallback polling for unread count
 * - On recovery, disables polling (Realtime pushes updates directly)
 *
 * Call this once at a high level (e.g., MainLayout) so the subscription
 * persists across page navigations.
 */
export function useNotificationRealtime() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Use ref to avoid stale closure in Supabase callback
  const showToastRef = useRef(useNotificationUiStore.getState().showToastOnNew);
  // Track whether we've connected before to distinguish reconnect from first connect
  const hasConnectedRef = useRef(false);
  // Cooldown: track last invalidation timestamp to prevent burst from connection flapping
  const lastInvalidatedRef = useRef<number>(0);

  useEffect(() => {
    const unsub = useNotificationUiStore.subscribe((state) => {
      showToastRef.current = state.showToastOnNew;
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    realtimeManager.initialize();

    realtimeManager.subscribeToNotifications(user.id, {
      onNewNotification: () => {
        // Direct cache update: increment unread count for instant badge
        queryClient.setQueryData<number>(
          queryKeys.notifications.totalUnreadCount(),
          (old) => (old ?? 0) + 1,
        );

        // Invalidate notification list to pick up the new item
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.lists(),
        });

        // Show toast if enabled
        if (showToastRef.current) {
          useToastStore.getState().addToast({
            type: 'info',
            message: 'New notification received',
            duration: 5000,
          });
        }
      },

      onSubscriptionStatus: (status) => {
        if (status === 'SUBSCRIBED') {
          if (hasConnectedRef.current) {
            // Reconnection — invalidate all notification queries to catch missed events,
            // but only if we haven't invalidated recently (prevents burst from flapping)
            const now = Date.now();
            if (now - lastInvalidatedRef.current > RECONNECT_INVALIDATION_COOLDOWN_MS) {
              lastInvalidatedRef.current = now;
              void queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.all,
              });
            }
          }
          hasConnectedRef.current = true;

          // Realtime is healthy — disable polling (Realtime pushes updates directly)
          queryClient.setQueryDefaults(queryKeys.notifications.totalUnreadCount(), {
            refetchInterval: false,
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Realtime is down — enable 30s fallback polling
          queryClient.setQueryDefaults(queryKeys.notifications.totalUnreadCount(), {
            refetchInterval: 30_000,
          });
        }
      },
    });

    return () => {
      hasConnectedRef.current = false;
      realtimeManager.unsubscribeFromNotifications(user.id);
    };
  }, [user?.id, queryClient]);
}
