import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { toast } from '@stores/toastStore';
import { QUERY_CACHE } from '@/constants';
import { ApiException, getErrorMessage } from '@lib/api/errors';
import { workspaceApi } from '@features/workspaces/api/workspaceApi';
import { useWorkspaceUiStore } from '@features/workspaces/stores/workspaceUiStore';
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '@features/workspaces/types/workspace';

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.lists(),
    queryFn: () => workspaceApi.getAll(),
    staleTime: QUERY_CACHE.STALE_LONG,
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
        description: newWorkspace.description ?? null,
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

    onError: (err, _input, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(queryKeys.workspaces.lists(), context.previousWorkspaces);
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
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

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.detail(id) });

      const previousList = queryClient.getQueryData<Workspace[]>(queryKeys.workspaces.lists());
      const previousDetail = queryClient.getQueryData<Workspace>(queryKeys.workspaces.detail(id));

      if (previousList) {
        queryClient.setQueryData<Workspace[]>(
          queryKeys.workspaces.lists(),
          previousList.map((w) =>
            w.id === id ? { ...w, ...input, updatedAt: new Date().toISOString() } : w,
          ),
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<Workspace>(queryKeys.workspaces.detail(id), {
          ...previousDetail,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousList, previousDetail, id };
    },

    onError: (err, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.workspaces.lists(), context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.workspaces.detail(context.id), context.previousDetail);
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: () => {
      toast.success('Workspace updated');
    },

    onSettled: (_, __, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(id) });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);
  const activeWorkspaceId = useWorkspaceUiStore((s) => s.activeWorkspaceId);

  return useMutation({
    mutationFn: (id: string) => workspaceApi.remove(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.lists() });

      const previousList = queryClient.getQueryData<Workspace[]>(queryKeys.workspaces.lists());
      const previousActiveWorkspaceId = activeWorkspaceId;

      if (previousList) {
        const remaining = previousList.filter((w) => w.id !== id);
        queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.lists(), remaining);

        // Switch active workspace if we're deleting the current one
        if (activeWorkspaceId === id && remaining.length > 0) {
          setActiveWorkspace(remaining[0].id);
        }
      }

      return { previousList, previousActiveWorkspaceId };
    },

    onError: (err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.workspaces.lists(), context.previousList);
      }
      if (context?.previousActiveWorkspaceId) {
        setActiveWorkspace(context.previousActiveWorkspaceId);
      }
      toast.error(
        ApiException.isApiException(err) ? getErrorMessage(err.code) : getErrorMessage('UNKNOWN'),
      );
    },

    onSuccess: () => {
      toast.success('Workspace deleted');
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
    },
  });
}
