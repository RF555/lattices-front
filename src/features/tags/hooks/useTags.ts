import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { tagApi } from '../api/tagApi';
import type { Tag, CreateTagInput, UpdateTagInput } from '../types/tag';

export function useTags(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.tags.list({ workspaceId }),
    queryFn: () => tagApi.getAll(workspaceId),
  });
}

export function useCreateTag(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) => tagApi.create(input, workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) => tagApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.lists() });

      const previousTags = queryClient.getQueryData<Tag[]>(queryKeys.tags.lists());

      if (previousTags) {
        queryClient.setQueryData<Tag[]>(
          queryKeys.tags.lists(),
          previousTags.filter((tag) => tag.id !== id),
        );
      }

      return { previousTags };
    },
    onError: (_, __, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(queryKeys.tags.lists(), context.previousTags);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
  });
}

export function useAddTagToTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, tagId }: { todoId: string; tagId: string }) =>
      tagApi.addToTodo(todoId, tagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useRemoveTagFromTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, tagId }: { todoId: string; tagId: string }) =>
      tagApi.removeFromTodo(todoId, tagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}
