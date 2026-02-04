import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { groupApi } from '../api/groupApi';
import type { CreateGroupInput, UpdateGroupInput } from '../types/group';

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
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
      toast.success('Group created');
    },
    onError: () => {
      toast.error('Failed to create group');
    },
  });
}

export function useUpdateGroup(workspaceId: string | undefined, groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroupInput) => groupApi.update(workspaceId!, groupId!, input),
    onSuccess: () => {
      if (workspaceId && groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
      toast.success('Group updated');
    },
    onError: () => {
      toast.error('Failed to update group');
    },
  });
}

export function useDeleteGroup(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupApi.delete(workspaceId!, groupId),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.groups(workspaceId) });
      }
      toast.success('Group deleted');
    },
    onError: () => {
      toast.error('Failed to delete group');
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupMembers(workspaceId, groupId),
        });
        queryClient.invalidateQueries({
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

export function useRemoveGroupMember(
  workspaceId: string | undefined,
  groupId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(workspaceId!, groupId!, userId),
    onSuccess: () => {
      if (workspaceId && groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupMembers(workspaceId, groupId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.workspaces.groupDetail(workspaceId, groupId),
        });
      }
      toast.success('Member removed from group');
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });
}
