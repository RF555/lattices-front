import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceRole,
} from '@features/workspaces/types/workspace';

/** Raw workspace shape returned by the API (snake_case). */
interface ApiWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

/** Raw workspace member shape returned by the API (snake_case). */
interface ApiWorkspaceMember {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: WorkspaceRole;
  joined_at: string;
}

function mapWorkspace(raw: ApiWorkspace): Workspace {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    createdBy: raw.created_by,
    memberCount: raw.member_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapMember(raw: ApiWorkspaceMember): WorkspaceMember {
  return {
    userId: raw.user_id,
    email: raw.email,
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url,
    role: raw.role,
    joinedAt: raw.joined_at,
  };
}

export const workspaceApi = {
  async getAll(): Promise<Workspace[]> {
    const response = await apiClient.get<ListResponse<ApiWorkspace>>('/workspaces');
    return response.data.map(mapWorkspace);
  },

  async getById(id: string): Promise<Workspace> {
    const response = await apiClient.get<SingleResponse<ApiWorkspace>>(`/workspaces/${id}`);
    return mapWorkspace(response.data);
  },

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const response = await apiClient.post<SingleResponse<ApiWorkspace>>('/workspaces', {
      name: input.name,
      description: input.description,
    });
    return mapWorkspace(response.data);
  },

  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.description !== undefined) body.description = input.description;

    const response = await apiClient.patch<SingleResponse<ApiWorkspace>>(`/workspaces/${id}`, body);
    return mapWorkspace(response.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/workspaces/${id}`);
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<ListResponse<ApiWorkspaceMember>>(
      `/workspaces/${workspaceId}/members`,
    );
    return response.data.map(mapMember);
  },

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const response = await apiClient.post<SingleResponse<ApiWorkspaceMember>>(
      `/workspaces/${workspaceId}/members`,
      { user_id: userId, role },
    );
    return mapMember(response.data);
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const response = await apiClient.patch<SingleResponse<ApiWorkspaceMember>>(
      `/workspaces/${workspaceId}/members/${userId}`,
      { role },
    );
    return mapMember(response.data);
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/transfer-ownership`, {
      new_owner_id: newOwnerId,
    });
  },
};
