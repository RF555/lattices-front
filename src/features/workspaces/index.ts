// Types
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Invitation,
} from './types/workspace';
export type { ActivityEntry } from './types/activity';
export type { Group, GroupMember, CreateGroupInput, UpdateGroupInput } from './types/group';

// API
export { workspaceApi } from './api/workspaceApi';
export { invitationApi } from './api/invitationApi';
export { activityApi } from './api/activityApi';
export { groupApi } from './api/groupApi';

// Hooks
export {
  useWorkspaces,
  useWorkspace,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from './hooks/useWorkspaces';
export {
  useWorkspaceMembers,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
  useTransferOwnership,
} from './hooks/useWorkspaceMembers';
export {
  useWorkspaceInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useAcceptInvitation,
  usePendingInvitations,
} from './hooks/useInvitations';
export { useWorkspaceActivity, useEntityHistory } from './hooks/useActivity';
export { useWorkspacePermission } from './hooks/useWorkspacePermission';
export { useActiveWorkspace } from './hooks/useActiveWorkspace';
export { useWorkspaceRealtime } from './hooks/useWorkspaceRealtime';
export { usePresence } from './hooks/usePresence';
export {
  useGroups,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
} from './hooks/useGroups';

// Stores
export {
  useWorkspaceUiStore,
  useActiveWorkspaceId,
  useSidebarOpen,
} from './stores/workspaceUiStore';
