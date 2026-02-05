export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
}
