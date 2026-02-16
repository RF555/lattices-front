import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { ApiException, getErrorMessage } from '@lib/api/errors';
import { workspaceApi } from '@features/workspaces/api/workspaceApi';
import type {
  WorkspaceRole,
  WorkspaceMember,
  Workspace,
} from '@features/workspaces/types/workspace';

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: WorkspaceRole;
    }) => workspaceApi.addMember(workspaceId, userId, role),

    onError: (err) => {
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: (_, { workspaceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      toast.success('Member added');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: WorkspaceRole;
    }) => workspaceApi.updateMemberRole(workspaceId, userId, role),

    onMutate: async ({ workspaceId, userId, role }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>(
        queryKeys.workspaces.members(workspaceId),
      );

      if (previousMembers) {
        queryClient.setQueryData<WorkspaceMember[]>(
          queryKeys.workspaces.members(workspaceId),
          previousMembers.map((m) => (m.userId === userId ? { ...m, role } : m)),
        );
      }

      return { previousMembers, workspaceId };
    },

    onError: (err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          queryKeys.workspaces.members(context.workspaceId),
          context.previousMembers,
        );
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: () => {
      toast.success('Role updated');
    },

    onSettled: (_, __, { workspaceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      workspaceApi.removeMember(workspaceId, userId),

    onMutate: async ({ workspaceId, userId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.lists() });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>(
        queryKeys.workspaces.members(workspaceId),
      );
      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        queryKeys.workspaces.lists(),
      );

      if (previousMembers) {
        queryClient.setQueryData<WorkspaceMember[]>(
          queryKeys.workspaces.members(workspaceId),
          previousMembers.filter((m) => m.userId !== userId),
        );
      }

      // Decrement memberCount on the workspace
      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(
          queryKeys.workspaces.lists(),
          previousWorkspaces.map((w) =>
            w.id === workspaceId ? { ...w, memberCount: Math.max(0, w.memberCount - 1) } : w,
          ),
        );
      }

      return { previousMembers, previousWorkspaces, workspaceId };
    },

    onError: (err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          queryKeys.workspaces.members(context.workspaceId),
          context.previousMembers,
        );
      }
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(queryKeys.workspaces.lists(), context.previousWorkspaces);
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: () => {
      toast.success('Member removed');
    },

    onSettled: (_, __, { workspaceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
    },
  });
}

export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, newOwnerId }: { workspaceId: string; newOwnerId: string }) =>
      workspaceApi.transferOwnership(workspaceId, newOwnerId),

    onMutate: async ({ workspaceId, newOwnerId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>(
        queryKeys.workspaces.members(workspaceId),
      );

      if (previousMembers) {
        queryClient.setQueryData<WorkspaceMember[]>(
          queryKeys.workspaces.members(workspaceId),
          previousMembers.map((m) => {
            if (m.role === 'owner') return { ...m, role: 'admin' as WorkspaceRole };
            if (m.userId === newOwnerId) return { ...m, role: 'owner' as WorkspaceRole };
            return m;
          }),
        );
      }

      return { previousMembers, workspaceId };
    },

    onError: (err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          queryKeys.workspaces.members(context.workspaceId),
          context.previousMembers,
        );
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: () => {
      toast.success('Ownership transferred');
    },

    onSettled: (_, __, { workspaceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
  });
}
