import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@lib/realtime';
import { queryKeys } from '@lib/api/queryKeys';
import type { RealtimeCallbacks } from '@lib/realtime';

/**
 * Subscribes to Supabase Realtime Postgres Changes for a workspace.
 * On any INSERT/UPDATE/DELETE, invalidates the relevant TanStack Query
 * cache keys so components refetch automatically.
 *
 * Uses refs to avoid stale closures in subscription callbacks.
 */
export function useWorkspaceRealtime(workspaceId: string | null | undefined): void {
  const queryClient = useQueryClient();
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!workspaceId) return;

    realtimeManager.initialize();

    const callbacks: RealtimeCallbacks = {
      onTodoChange: () => {
        const wsId = workspaceIdRef.current;
        if (!wsId) return;
        void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.todos.all });
      },
      onTagChange: () => {
        const wsId = workspaceIdRef.current;
        if (!wsId) return;
        void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.tags.all });
      },
      onMemberChange: () => {
        const wsId = workspaceIdRef.current;
        if (!wsId) return;
        void queryClientRef.current.invalidateQueries({
          queryKey: queryKeys.workspaces.members(wsId),
        });
      },
      onActivityChange: () => {
        const wsId = workspaceIdRef.current;
        if (!wsId) return;
        void queryClientRef.current.invalidateQueries({
          queryKey: queryKeys.workspaces.activity(wsId),
        });
        // Also refresh notifications since activity may generate them
        void queryClientRef.current.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });
      },
    };

    realtimeManager.subscribeToWorkspace(workspaceId, callbacks);

    return () => {
      realtimeManager.unsubscribeFromWorkspace(workspaceId);
    };
  }, [workspaceId]);
}
