export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdBy: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
}

export interface InvitationCreatedResult {
  invitation: Invitation;
  token: string;
}

export interface AcceptInvitationResult {
  workspaceId: string;
  workspaceName: string;
  role: string;
}
