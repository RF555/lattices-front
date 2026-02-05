import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { invitationApi } from '../api/invitationApi';
import type { WorkspaceRole } from '../types/workspace';

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.invitations(workspaceId),
    queryFn: () => invitationApi.getWorkspaceInvitations(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role: WorkspaceRole;
    }) => invitationApi.createInvitation(workspaceId, email, role),

    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      invitationId,
    }: {
      workspaceId: string;
      invitationId: string;
    }) => invitationApi.revokeInvitation(workspaceId, invitationId),

    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
      toast.success('Invitation revoked');
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationApi.acceptInvitation(token),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
      toast.success('Invitation accepted! Welcome to the workspace.');
    },
  });
}

export function useAcceptInvitationById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationApi.acceptInvitationById(invitationId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
      toast.success('Invitation accepted! Welcome to the workspace.');
    },
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.pending(),
    queryFn: () => invitationApi.getPendingInvitations(),
  });
}
