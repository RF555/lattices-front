import { apiClient } from '@lib/api/client';
import type { ListResponse } from '@lib/api/types';
import type {
  AcceptInvitationResult,
  Invitation,
  InvitationCreatedResult,
  WorkspaceRole,
} from '../types/workspace';

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

/** Raw response from POST /invitations/accept and POST /invitations/{id}/accept. */
interface ApiAcceptInvitationResponse {
  workspace_id: string;
  workspace_name: string;
  role: string;
  message: string;
}

/** Raw response from POST /workspaces/{id}/invitations (includes token). */
interface ApiInvitationCreatedResponse {
  data: ApiInvitation;
  token: string;
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

function mapAcceptResponse(raw: ApiAcceptInvitationResponse): AcceptInvitationResult {
  return {
    workspaceId: raw.workspace_id,
    workspaceName: raw.workspace_name,
    role: raw.role,
  };
}

export const invitationApi = {
  async createInvitation(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
  ): Promise<InvitationCreatedResult> {
    const response = await apiClient.post<ApiInvitationCreatedResponse>(
      `/workspaces/${workspaceId}/invitations`,
      { email, role },
    );
    return {
      invitation: mapInvitation(response.data),
      token: response.token,
    };
  },

  async getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
    const response = await apiClient.get<ListResponse<ApiInvitation>>(
      `/workspaces/${workspaceId}/invitations`,
    );
    return response.data.map(mapInvitation);
  },

  async revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  async acceptInvitation(token: string): Promise<AcceptInvitationResult> {
    const response = await apiClient.post<ApiAcceptInvitationResponse>('/invitations/accept', {
      token,
    });
    return mapAcceptResponse(response);
  },

  async acceptInvitationById(invitationId: string): Promise<AcceptInvitationResult> {
    const response = await apiClient.post<ApiAcceptInvitationResponse>(
      `/invitations/${invitationId}/accept`,
    );
    return mapAcceptResponse(response);
  },

  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get<ListResponse<ApiInvitation>>('/invitations/pending');
    return response.data.map(mapInvitation);
  },
};
