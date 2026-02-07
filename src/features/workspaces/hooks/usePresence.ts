import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { realtimeManager, type PresenceUser } from '@lib/realtime';
import { useAuthStore } from '@features/auth/stores/authStore';

interface PresenceResult {
  /** All online users in the workspace (excluding self) */
  onlineUsers: PresenceUser[];
  /** Map of taskId -> users currently viewing that task (excluding self) */
  viewingTask: Map<string, PresenceUser[]>;
  /** Update which task the current user is viewing (null to clear) */
  setViewingTask: (taskId: string | null) => void;
}

/**
 * Manages presence tracking for a workspace. Publishes the current user's
 * online status and which task they are viewing. Returns the list of online
 * users and a per-task viewing map.
 */
export function usePresence(workspaceId: string | null | undefined): PresenceResult {
  const user = useAuthStore((s) => s.user);
  const [allUsers, setAllUsers] = useState<PresenceUser[]>([]);
  const viewingTaskRef = useRef<string | null>(null);

  // Track current user so the presence payload is always up to date
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!workspaceId || !user) return;

    realtimeManager.initialize();

    realtimeManager.subscribeToPresence(workspaceId, {
      onSync: (users) => {
        setAllUsers(users);
      },
    });

    // Publish initial presence
    void realtimeManager.updatePresence(workspaceId, {
      userId: user.id,
      displayName: user.name ?? user.email,
      avatarUrl: user.avatarUrl ?? null,
      lastSeen: new Date().toISOString(),
      viewingTaskId: null,
    });

    return () => {
      realtimeManager.unsubscribeFromPresence(workspaceId);
      setAllUsers([]);
    };
  }, [workspaceId, user]);

  const setViewingTask = useCallback(
    (taskId: string | null) => {
      if (!workspaceId || !userRef.current) return;
      viewingTaskRef.current = taskId;
      void realtimeManager.updatePresence(workspaceId, {
        userId: userRef.current.id,
        displayName: userRef.current.name ?? userRef.current.email,
        avatarUrl: userRef.current.avatarUrl ?? null,
        lastSeen: new Date().toISOString(),
        viewingTaskId: taskId,
      });
    },
    [workspaceId],
  );

  // Filter out self from online users
  const onlineUsers = useMemo(
    () => allUsers.filter((u) => u.userId !== user?.id),
    [allUsers, user?.id],
  );

  // Build per-task viewing map (excluding self)
  const viewingTask = useMemo(() => {
    const map = new Map<string, PresenceUser[]>();
    for (const u of onlineUsers) {
      if (u.viewingTaskId) {
        const existing = map.get(u.viewingTaskId) ?? [];
        existing.push(u);
        map.set(u.viewingTaskId, existing);
      }
    }
    return map;
  }, [onlineUsers]);

  return { onlineUsers, viewingTask, setViewingTask };
}
