import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { workspaceApi } from '../api/workspaceApi';
import { useWorkspaceUiStore } from '../stores/workspaceUiStore';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '../types/workspace';

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.lists(),
    queryFn: () => workspaceApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => workspaceApi.getById(id),
    enabled: id.length > 0,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => workspaceApi.create(input),

    onMutate: async (newWorkspace) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.lists() });

      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        queryKeys.workspaces.lists(),
      );

      const optimistic: Workspace = {
        id: `temp-${Date.now()}`,
        name: newWorkspace.name,
        slug: '',
        description: newWorkspace.description || null,
        createdBy: '',
        memberCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.lists(), [
          ...previousWorkspaces,
          optimistic,
        ]);
      }

      return { previousWorkspaces };
    },

    onError: (_err, _input, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(queryKeys.workspaces.lists(), context.previousWorkspaces);
      }
    },

    onSuccess: () => {
      toast.success('Workspace created successfully');
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkspaceInput }) =>
      workspaceApi.update(id, input),

    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(id) });
      toast.success('Workspace updated');
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);

  return useMutation({
    mutationFn: (id: string) => workspaceApi.remove(id),

    onSuccess: (_, deletedId) => {
      const workspaces = queryClient.getQueryData<Workspace[]>(queryKeys.workspaces.lists());
      const remaining = workspaces?.filter((w) => w.id !== deletedId);
      if (remaining && remaining.length > 0) {
        setActiveWorkspace(remaining[0].id);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      toast.success('Workspace deleted');
    },
  });
}
