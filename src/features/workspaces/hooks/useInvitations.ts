import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { invitationApi } from '@features/workspaces/api/invitationApi';
import type { WorkspaceRole, Invitation } from '@features/workspaces/types/workspace';

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.invitations(workspaceId),
    queryFn: () => invitationApi.getWorkspaceInvitations(workspaceId),
    enabled: workspaceId.length > 0,
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

    onMutate: async ({ workspaceId, email, role }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });

      const previousInvitations = queryClient.getQueryData<Invitation[]>(
        queryKeys.workspaces.invitations(workspaceId),
      );

      const optimisticInvitation: Invitation = {
        id: `temp-${Date.now()}`,
        workspaceId,
        workspaceName: '',
        email,
        role,
        invitedByName: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (previousInvitations) {
        queryClient.setQueryData<Invitation[]>(queryKeys.workspaces.invitations(workspaceId), [
          ...previousInvitations,
          optimisticInvitation,
        ]);
      }

      return { previousInvitations, workspaceId };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(
          queryKeys.workspaces.invitations(context.workspaceId),
          context.previousInvitations,
        );
      }
    },

    onSettled: (_, __, { workspaceId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      invitationApi.revokeInvitation(workspaceId, invitationId),

    onMutate: async ({ workspaceId, invitationId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });

      const previousInvitations = queryClient.getQueryData<Invitation[]>(
        queryKeys.workspaces.invitations(workspaceId),
      );

      if (previousInvitations) {
        queryClient.setQueryData<Invitation[]>(
          queryKeys.workspaces.invitations(workspaceId),
          previousInvitations.map((inv) =>
            inv.id === invitationId ? { ...inv, status: 'revoked' as const } : inv,
          ),
        );
      }

      return { previousInvitations, workspaceId };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(
          queryKeys.workspaces.invitations(context.workspaceId),
          context.previousInvitations,
        );
      }
    },

    onSuccess: () => {
      toast.success('Invitation revoked');
    },

    onSettled: (_, __, { workspaceId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationApi.acceptInvitation(token),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
      toast.success('Invitation accepted! Welcome to the workspace.');
    },
  });
}

export function useAcceptInvitationById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationApi.acceptInvitationById(invitationId),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
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
