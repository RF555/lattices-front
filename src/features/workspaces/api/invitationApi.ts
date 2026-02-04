import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type { Invitation, WorkspaceMember, WorkspaceRole } from '../types/workspace';

/** Raw invitation shape returned by the API (snake_case). */
interface ApiInvitation {
  id: string;
  workspace_id: string;
  workspace_name: string;
  email: string;
  role: WorkspaceRole;
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
}

interface ApiWorkspaceMember {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: WorkspaceRole;
  joined_at: string;
}

function mapInvitation(raw: ApiInvitation): Invitation {
  return {
    id: raw.id,
    workspaceId: raw.workspace_id,
    workspaceName: raw.workspace_name,
    email: raw.email,
    role: raw.role,
    invitedByName: raw.invited_by_name,
    status: raw.status,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
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

export const invitationApi = {
  async createInvitation(
    workspaceId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<Invitation> {
    const response = await apiClient.post<SingleResponse<ApiInvitation>>(
      `/workspaces/${workspaceId}/invitations`,
      { email, role }
    );
    return mapInvitation(response.data);
  },

  async getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
    const response = await apiClient.get<ListResponse<ApiInvitation>>(
      `/workspaces/${workspaceId}/invitations`
    );
    return response.data.map(mapInvitation);
  },

  async revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  async acceptInvitation(token: string): Promise<WorkspaceMember> {
    const response = await apiClient.post<SingleResponse<ApiWorkspaceMember>>(
      '/invitations/accept',
      { token }
    );
    return mapMember(response.data);
  },

  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get<ListResponse<ApiInvitation>>('/invitations/pending');
    return response.data.map(mapInvitation);
  },
};
