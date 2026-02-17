import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/api/queryKeys';
import { todoApi } from '../api/todoApi';
import type { Todo } from '../types/todo';

interface ReorderInput {
  itemId: string;
  swapWithId: string;
  itemPosition: number;
  swapWithPosition: number;
}

export function useReorderSibling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, swapWithId, itemPosition, swapWithPosition }: ReorderInput) => {
      await Promise.all([
        todoApi.update(itemId, { position: swapWithPosition }),
        todoApi.update(swapWithId, { position: itemPosition }),
      ]);
    },

    onMutate: async ({ itemId, swapWithId, itemPosition, swapWithPosition }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.lists() });

      const previousQueries = queryClient.getQueriesData<Todo[]>({
        queryKey: queryKeys.todos.lists(),
      });

      for (const [queryKey, data] of previousQueries) {
        if (data) {
          queryClient.setQueryData<Todo[]>(
            queryKey,
            data.map((todo) => {
              if (todo.id === itemId) {
                return { ...todo, position: swapWithPosition, updatedAt: new Date().toISOString() };
              }
              if (todo.id === swapWithId) {
                return { ...todo, position: itemPosition, updatedAt: new Date().toISOString() };
              }
              return todo;
            }),
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
