import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@lib/realtime';
import { queryKeys } from '@lib/api/queryKeys';
import type { RealtimeCallbacks } from '@lib/realtime';

/**
 * Subscribes to Supabase Realtime Postgres Changes for ALL workspaces.
 * Used in "All Workspaces" mode to receive live updates from every workspace.
 *
 * Iterates over the workspace ID list and subscribes to each channel.
 * On any change, invalidates global query keys (todos, tags) so the
 * combined view refreshes.
 */
export function useAllWorkspacesRealtime(workspaceIds: string[], enabled: boolean): void {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Stable serialization for dependency tracking
  const idsKey = workspaceIds.join(',');

  useEffect(() => {
    if (!enabled || workspaceIds.length === 0) return;

    realtimeManager.initialize();

    const callbacks: RealtimeCallbacks = {
      onTodoChange: () => {
        void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.todos.all });
      },
      onTagChange: () => {
        void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.tags.all });
      },
    };

    for (const wsId of workspaceIds) {
      realtimeManager.subscribeToWorkspace(wsId, callbacks);
    }

    return () => {
      for (const wsId of workspaceIds) {
        realtimeManager.unsubscribeFromWorkspace(wsId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, enabled]);
}
