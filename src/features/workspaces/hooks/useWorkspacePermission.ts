import { useMemo } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useWorkspaceMembers } from './useWorkspaceMembers';
import type { WorkspaceRole } from '@features/workspaces/types/workspace';

interface WorkspacePermissions {
  role: WorkspaceRole | null;
  canEdit: boolean;
  canManageMembers: boolean;
  canDelete: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
}

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function useWorkspacePermission(workspaceId?: string): WorkspacePermissions {
  const user = useAuthStore((s) => s.user);
  const { data: members } = useWorkspaceMembers(workspaceId ?? '');

  return useMemo(() => {
    if (!user || !members || !workspaceId) {
      return {
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      };
    }

    const currentMember = members.find((m) => m.userId === user.id);
    const role = currentMember?.role ?? null;

    if (!role) {
      return {
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      };
    }

    const level = ROLE_HIERARCHY[role];

    return {
      role,
      canEdit: level >= ROLE_HIERARCHY.member,
      canManageMembers: level >= ROLE_HIERARCHY.admin,
      canDelete: role === 'owner',
      isOwner: role === 'owner',
      isAdmin: role === 'admin',
      isMember: role === 'member',
      isViewer: role === 'viewer',
    };
  }, [user, members, workspaceId]);
}
