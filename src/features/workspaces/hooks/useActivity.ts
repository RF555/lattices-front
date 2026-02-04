import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { activityApi } from '../api/activityApi';

export function useWorkspaceActivity(
  workspaceId: string,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.activity(workspaceId), options],
    queryFn: () =>
      activityApi.getWorkspaceActivity(workspaceId, options?.limit, options?.offset),
    enabled: !!workspaceId,
  });
}

export function useEntityHistory(
  workspaceId: string,
  entityType: string,
  entityId: string
) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.activity(workspaceId), entityType, entityId],
    queryFn: () => activityApi.getEntityHistory(workspaceId, entityType, entityId),
    enabled: !!workspaceId && !!entityType && !!entityId,
  });
}
