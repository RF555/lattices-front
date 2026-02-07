import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { groupApi } from '../api/groupApi';
import type { Group, GroupMember, CreateGroupInput, UpdateGroupInput } from '../types/group';

export function useGroups(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.groups(workspaceId!),
    queryFn: () => groupApi.getAll(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useGroup(workspaceId: string | undefined, groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.groupDetail(workspaceId!, groupId!),
    queryFn: () => groupApi.getById(workspaceId!, groupId!),
    enabled: !!workspaceId && !!groupId,
  });
}

export function useCreateGroup(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupApi.create(workspaceId!, input),

    onMutate: async (input) => {
      if (!workspaceId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });

      const previousGroups = queryClient.getQueryData<Group[]>(
        queryKeys.workspaces.groups(workspaceId),
      );

      const optimisticGroup: Group = {
        id: `temp-${Date.now()}`,
        workspaceId,
        name: input.name,
        description: input.description ?? null,
        memberCount: 0,
        createdAt: new Date().toISOString(),
      };

      if (previousGroups) {
        queryClient.setQueryData<Group[]>(queryKeys.workspaces.groups(workspaceId), [
          ...previousGroups,
          optimisticGroup,
        ]);
      }

      return { previousGroups, workspaceId };
    },

    onError: (_err, _input, context) => {
      if (context?.previousGroups && context.workspaceId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groups(context.workspaceId),
          context.previousGroups,
        );
      }
      toast.error('Failed to create group');
    },

    onSuccess: () => {
      toast.success('Group created');
    },

    onSettled: () => {
      if (workspaceId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
    },
  });
}

export function useUpdateGroup(workspaceId: string | undefined, groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroupInput) => groupApi.update(workspaceId!, groupId!, input),

    onMutate: async (input) => {
      if (!workspaceId || !groupId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
      });

      const previousGroups = queryClient.getQueryData<Group[]>(
        queryKeys.workspaces.groups(workspaceId),
      );
      const previousDetail = queryClient.getQueryData<Group>(
        queryKeys.workspaces.groupDetail(workspaceId, groupId),
      );

      if (previousGroups) {
        queryClient.setQueryData<Group[]>(
          queryKeys.workspaces.groups(workspaceId),
          previousGroups.map((g) => (g.id === groupId ? { ...g, ...input } : g)),
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<Group>(queryKeys.workspaces.groupDetail(workspaceId, groupId), {
          ...previousDetail,
          ...input,
        });
      }

      return { previousGroups, previousDetail, workspaceId, groupId };
    },

    onError: (_err, _input, context) => {
      if (context?.previousGroups && context.workspaceId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groups(context.workspaceId),
          context.previousGroups,
        );
      }
      if (context?.previousDetail && context.workspaceId && context.groupId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groupDetail(context.workspaceId, context.groupId),
          context.previousDetail,
        );
      }
      toast.error('Failed to update group');
    },

    onSuccess: () => {
      toast.success('Group updated');
    },

    onSettled: () => {
      if (workspaceId && groupId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
    },
  });
}

export function useDeleteGroup(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupApi.delete(workspaceId!, groupId),

    onMutate: async (groupId) => {
      if (!workspaceId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });

      const previousGroups = queryClient.getQueryData<Group[]>(
        queryKeys.workspaces.groups(workspaceId),
      );

      if (previousGroups) {
        queryClient.setQueryData<Group[]>(
          queryKeys.workspaces.groups(workspaceId),
          previousGroups.filter((g) => g.id !== groupId),
        );
      }

      return { previousGroups, workspaceId };
    },

    onError: (_err, _groupId, context) => {
      if (context?.previousGroups && context.workspaceId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groups(context.workspaceId),
          context.previousGroups,
        );
      }
      toast.error('Failed to delete group');
    },

    onSuccess: () => {
      toast.success('Group deleted');
    },

    onSettled: () => {
      if (workspaceId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
    },
  });
}

export function useGroupMembers(workspaceId: string | undefined, groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.groupMembers(workspaceId!, groupId!),
    queryFn: () => groupApi.getMembers(workspaceId!, groupId!),
    enabled: !!workspaceId && !!groupId,
  });
}

export function useAddGroupMember(workspaceId: string | undefined, groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role?: 'admin' | 'member' }) =>
      groupApi.addMember(workspaceId!, groupId!, userId, role),
    onSuccess: () => {
      if (workspaceId && groupId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupMembers(workspaceId, groupId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
        });
      }
      toast.success('Member added to group');
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });
}

export function useRemoveGroupMember(workspaceId: string | undefined, groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(workspaceId!, groupId!, userId),

    onMutate: async (userId) => {
      if (!workspaceId || !groupId) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.groupMembers(workspaceId, groupId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.groups(workspaceId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
      });

      const previousMembers = queryClient.getQueryData<GroupMember[]>(
        queryKeys.workspaces.groupMembers(workspaceId, groupId),
      );
      const previousGroups = queryClient.getQueryData<Group[]>(
        queryKeys.workspaces.groups(workspaceId),
      );
      const previousDetail = queryClient.getQueryData<Group>(
        queryKeys.workspaces.groupDetail(workspaceId, groupId),
      );

      if (previousMembers) {
        queryClient.setQueryData<GroupMember[]>(
          queryKeys.workspaces.groupMembers(workspaceId, groupId),
          previousMembers.filter((m) => m.userId !== userId),
        );
      }

      if (previousGroups) {
        queryClient.setQueryData<Group[]>(
          queryKeys.workspaces.groups(workspaceId),
          previousGroups.map((g) =>
            g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g,
          ),
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<Group>(queryKeys.workspaces.groupDetail(workspaceId, groupId), {
          ...previousDetail,
          memberCount: Math.max(0, previousDetail.memberCount - 1),
        });
      }

      return { previousMembers, previousGroups, previousDetail, workspaceId, groupId };
    },

    onError: (_err, _userId, context) => {
      if (context?.previousMembers && context.workspaceId && context.groupId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groupMembers(context.workspaceId, context.groupId),
          context.previousMembers,
        );
      }
      if (context?.previousGroups && context.workspaceId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groups(context.workspaceId),
          context.previousGroups,
        );
      }
      if (context?.previousDetail && context.workspaceId && context.groupId) {
        queryClient.setQueryData(
          queryKeys.workspaces.groupDetail(context.workspaceId, context.groupId),
          context.previousDetail,
        );
      }
      toast.error('Failed to remove member');
    },

    onSuccess: () => {
      toast.success('Member removed from group');
    },

    onSettled: () => {
      if (workspaceId && groupId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupMembers(workspaceId, groupId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groups(workspaceId),
        });
      }
    },
  });
}
