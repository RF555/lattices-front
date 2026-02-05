import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { todoApi } from '../api/todoApi';
import { buildTodoTree } from '../utils/treeUtils';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from '../types/todo';

export function useTodos(filters?: TodoFilters, workspaceId?: string) {
  const filterKey = { ...(filters || {}), workspaceId };
  return useQuery({
    queryKey: queryKeys.todos.list(filterKey),
    queryFn: () => todoApi.getAll(filters, workspaceId),
    select: (data) => buildTodoTree(data),
  });
}

export function useFlatTodos(filters?: TodoFilters, workspaceId?: string) {
  const filterKey = { ...(filters || {}), workspaceId };
  return useQuery({
    queryKey: queryKeys.todos.list(filterKey),
    queryFn: () => todoApi.getAll(filters, workspaceId),
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: queryKeys.todos.detail(id),
    queryFn: () => todoApi.getById(id),
    enabled: id.length > 0,
  });
}

export function useCreateTodo(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input, workspaceId),

    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title: newTodo.title,
        description: newTodo.description || null,
        isCompleted: false,
        parentId: newTodo.parentId || null,
        position: 999,
        completedAt: null,
        childCount: 0,
        completedChildCount: 0,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(queryKey, [...data, optimisticTodo]);
        }
      }

      return { previousQueries };
    },

    onError: (_err, _newTodo, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todoApi.update(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) =>
              todo.id === id ? { ...todo, ...input, updatedAt: new Date().toISOString() } : todo,
            ),
          );
        }
      }

      return { previousQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todoApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          const idsToRemove = new Set<string>([id]);
          const findDescendants = (parentId: string) => {
            for (const todo of data) {
              if (todo.parentId === parentId) {
                idsToRemove.add(todo.id);
                findDescendants(todo.id);
              }
            }
          };
          findDescendants(id);

          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.filter((todo) => !idsToRemove.has(todo.id)),
          );
        }
      }

      return { previousQueries };
    },

    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      todoApi.update(id, { isCompleted }),

    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) =>
              todo.id === id
                ? {
                    ...todo,
                    isCompleted,
                    completedAt: isCompleted ? new Date().toISOString() : null,
                  }
                : todo,
            ),
          );
        }
      }

      return { previousQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}

export function useMoveTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      parentId,
      position,
    }: {
      id: string;
      parentId: string | null;
      position: number;
    }) => todoApi.update(id, { parentId, position }),

    onMutate: async ({ id, parentId, position }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) =>
              todo.id === id
                ? { ...todo, parentId, position, updatedAt: new Date().toISOString() }
                : todo,
            ),
          );
        }
      }

      return { previousQueries };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
  });
}
