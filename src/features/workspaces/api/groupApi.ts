import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type {
  Group,
  GroupMember,
  CreateGroupInput,
  UpdateGroupInput,
} from '@features/workspaces/types/group';

// ─── API shapes (snake_case) ──────────────────────────────────────────

interface ApiGroup {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

interface ApiGroupMember {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────

function mapGroup(raw: ApiGroup): Group {
  return {
    id: raw.id,
    workspaceId: raw.workspace_id,
    name: raw.name,
    description: raw.description,
    memberCount: raw.member_count,
    createdAt: raw.created_at,
  };
}

function mapGroupMember(raw: ApiGroupMember): GroupMember {
  return {
    userId: raw.user_id,
    displayName: raw.display_name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    role: raw.role,
    joinedAt: raw.joined_at,
  };
}

// ─── API Client ───────────────────────────────────────────────────────

export const groupApi = {
  async getAll(workspaceId: string): Promise<Group[]> {
    const res = await apiClient.get<ListResponse<ApiGroup>>(`/workspaces/${workspaceId}/groups`);
    return res.data.map(mapGroup);
  },

  async getById(workspaceId: string, groupId: string): Promise<Group> {
    const res = await apiClient.get<SingleResponse<ApiGroup>>(
      `/workspaces/${workspaceId}/groups/${groupId}`,
    );
    return mapGroup(res.data);
  },

  async create(workspaceId: string, input: CreateGroupInput): Promise<Group> {
    const res = await apiClient.post<SingleResponse<ApiGroup>>(
      `/workspaces/${workspaceId}/groups`,
      input,
    );
    return mapGroup(res.data);
  },

  async update(workspaceId: string, groupId: string, input: UpdateGroupInput): Promise<Group> {
    const res = await apiClient.patch<SingleResponse<ApiGroup>>(
      `/workspaces/${workspaceId}/groups/${groupId}`,
      input,
    );
    return mapGroup(res.data);
  },

  async delete(workspaceId: string, groupId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/groups/${groupId}`);
  },

  // ── Group Members ─────────────────────────────────────────────────

  async getMembers(workspaceId: string, groupId: string): Promise<GroupMember[]> {
    const res = await apiClient.get<ListResponse<ApiGroupMember>>(
      `/workspaces/${workspaceId}/groups/${groupId}/members`,
    );
    return res.data.map(mapGroupMember);
  },

  async addMember(
    workspaceId: string,
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
  ): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/groups/${groupId}/members`, {
      user_id: userId,
      role,
    });
  },

  async removeMember(workspaceId: string, groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/groups/${groupId}/members/${userId}`);
  },
};
