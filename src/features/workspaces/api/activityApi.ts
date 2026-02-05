import { apiClient } from '@lib/api/client';
import type { ListResponse } from '@lib/api/types';
import type { ActivityEntry } from '../types/activity';

/** Raw activity entry shape returned by the API (snake_case). */
interface ApiActivityEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar_url: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}

function mapActivity(raw: ApiActivityEntry): ActivityEntry {
  return {
    id: raw.id,
    actorId: raw.actor_id,
    actorName: raw.actor_name,
    actorAvatarUrl: raw.actor_avatar_url,
    action: raw.action,
    entityType: raw.entity_type,
    entityId: raw.entity_id,
    entityTitle: raw.entity_title,
    changes: raw.changes,
    createdAt: raw.created_at,
  };
}

export const activityApi = {
  async getWorkspaceActivity(
    workspaceId: string,
    limit?: number,
    offset?: number,
  ): Promise<ActivityEntry[]> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await apiClient.get<ListResponse<ApiActivityEntry>>(
      `/workspaces/${workspaceId}/activity`,
      { params },
    );
    return response.data.map(mapActivity);
  },

  async getEntityHistory(
    workspaceId: string,
    entityType: string,
    entityId: string,
  ): Promise<ActivityEntry[]> {
    const response = await apiClient.get<ListResponse<ApiActivityEntry>>(
      `/workspaces/${workspaceId}/activity`,
      { params: { entity_type: entityType, entity_id: entityId } },
    );
    return response.data.map(mapActivity);
  },
};
