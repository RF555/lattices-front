import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { tagApi } from '../api/tagApi';
import type { Tag, CreateTagInput, UpdateTagInput } from '../types/tag';
import type { Todo, TagSummary } from '@features/todos/types/todo';

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

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.lists() });

      const previousTagQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: queryKeys.tags.lists(),
      });

      const optimisticTag: Tag = {
        id: `temp-${Date.now()}`,
        name: input.name,
        colorHex: input.colorHex ?? '#6b7280',
        workspaceId: input.workspaceId ?? workspaceId,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };

      for (const [queryKey, data] of previousTagQueries) {
        if (data) {
          queryClient.setQueryData<Tag[]>(queryKey, [...data, optimisticTag]);
        }
      }

      return { previousTagQueries };
    },

    onError: (_err, _input, context) => {
      if (context?.previousTagQueries) {
        for (const [queryKey, data] of context.previousTagQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) => tagApi.update(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tags.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousTagQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: queryKeys.tags.lists(),
      });

      const previousTodoQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      // Optimistically update the tag in the tags cache
      for (const [queryKey, data] of previousTagQueries) {
        if (data) {
          queryClient.setQueryData<Tag[]>(
            queryKey,
            data.map((tag) => (tag.id === id ? { ...tag, ...input } : tag)),
          );
        }
      }

      // Optimistically update the tag in all todos that reference it
      for (const [queryKey, data] of previousTodoQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) => ({
              ...todo,
              tags: todo.tags.map((tagSummary) =>
                tagSummary.id === id
                  ? {
                      ...tagSummary,
                      ...(input.name !== undefined ? { name: input.name } : {}),
                      ...(input.colorHex !== undefined ? { colorHex: input.colorHex } : {}),
                    }
                  : tagSummary,
              ),
            })),
          );
        }
      }

      return { previousTagQueries, previousTodoQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTagQueries) {
        for (const [queryKey, data] of context.previousTagQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousTodoQueries) {
        for (const [queryKey, data] of context.previousTodoQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
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

    onMutate: async ({ todoId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousTodoQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      // Find the tag data from the tags cache
      let tagData: TagSummary | undefined;
      const allTagQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: queryKeys.tags.lists(),
      });
      for (const [, tags] of allTagQueries) {
        if (tags) {
          const found = tags.find((t) => t.id === tagId);
          if (found) {
            tagData = { id: found.id, name: found.name, colorHex: found.colorHex };
            break;
          }
        }
      }

      // Optimistically add the tag to the todo
      if (tagData) {
        for (const [queryKey, data] of previousTodoQueries) {
          if (data) {
            queryClient.setQueryData<Todo[]>(
              queryKey,
              data.map((todo) =>
                todo.id === todoId && !todo.tags.some((t) => t.id === tagId)
                  ? { ...todo, tags: [...todo.tags, tagData] }
                  : todo,
              ),
            );
          }
        }
      }

      return { previousTodoQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTodoQueries) {
        for (const [queryKey, data] of context.previousTodoQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useRemoveTagFromTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, tagId }: { todoId: string; tagId: string }) =>
      tagApi.removeFromTodo(todoId, tagId),

    onMutate: async ({ todoId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousTodoQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      // Optimistically remove the tag from the todo
      for (const [queryKey, data] of previousTodoQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) =>
              todo.id === todoId
                ? { ...todo, tags: todo.tags.filter((t) => t.id !== tagId) }
                : todo,
            ),
          );
        }
      }

      return { previousTodoQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTodoQueries) {
        for (const [queryKey, data] of context.previousTodoQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}
