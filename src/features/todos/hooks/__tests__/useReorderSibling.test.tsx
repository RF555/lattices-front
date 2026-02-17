import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useReorderSibling } from '../useReorderSibling';
import type { Todo } from '@features/todos/types/todo';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

/** Helper to create a mock todo (camelCase frontend shape) */
function makeTodo(
  overrides: Partial<{
    id: string;
    title: string;
    isCompleted: boolean;
    parentId: string | null;
    position: number;
    description: string | null;
    completedAt: string | null;
    childCount: number;
    completedChildCount: number;
    tags: { id: string; name: string; colorHex: string }[];
    createdAt: string;
    updatedAt: string;
  }> = {},
): Todo {
  return {
    id: '1',
    title: 'Task',
    isCompleted: false,
    parentId: null,
    position: 0,
    description: null,
    completedAt: null,
    childCount: 0,
    completedChildCount: 0,
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Helper to create a snake_case API response shape */
function apiTodo(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    title: 'Task',
    is_completed: false,
    parent_id: null,
    position: 0,
    description: null,
    completed_at: null,
    child_count: 0,
    completed_child_count: 0,
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useReorderSibling', () => {
  it('should swap positions of two siblings successfully', async () => {
    const patchCalls: { id: string; position: number }[] = [];

    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        patchCalls.push({ id: params.id as string, position: body.position as number });
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, position: body.position as number }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [
      makeTodo({ id: 'a', title: 'First', position: 0 }),
      makeTodo({ id: 'b', title: 'Second', position: 1 }),
      makeTodo({ id: 'c', title: 'Third', position: 2 }),
    ];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useReorderSibling(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        itemId: 'a',
        swapWithId: 'b',
        itemPosition: 0,
        swapWithPosition: 1,
      });
    });

    // Two PATCH calls should be made (one for each item)
    expect(patchCalls).toHaveLength(2);
    expect(patchCalls).toContainEqual({ id: 'a', position: 1 });
    expect(patchCalls).toContainEqual({ id: 'b', position: 0 });
  });

  it('should optimistically swap positions in cache', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, position: body.position as number }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [
      makeTodo({ id: 'a', title: 'First', position: 0 }),
      makeTodo({ id: 'b', title: 'Second', position: 1 }),
    ];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useReorderSibling(), { wrapper });

    act(() => {
      result.current.mutate({
        itemId: 'a',
        swapWithId: 'b',
        itemPosition: 0,
        swapWithPosition: 1,
      });
    });

    // Check optimistic update was applied immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      const itemA = cached.find((t) => t.id === 'a');
      const itemB = cached.find((t) => t.id === 'b');
      expect(itemA?.position).toBe(1);
      expect(itemB?.position).toBe(0);
    });
  });

  it('should rollback on API error', async () => {
    // Suppress expected console.error from React Query
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    server.use(
      http.patch(`${API_URL}/todos/:id`, () => {
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [
      makeTodo({ id: 'a', title: 'First', position: 0 }),
      makeTodo({ id: 'b', title: 'Second', position: 1 }),
    ];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useReorderSibling(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          itemId: 'a',
          swapWithId: 'b',
          itemPosition: 0,
          swapWithPosition: 1,
        });
      } catch {
        // Expected to throw on 500 error
      }
    });

    // Cache should be rolled back to original positions
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      const itemA = cached.find((t) => t.id === 'a');
      const itemB = cached.find((t) => t.id === 'b');
      expect(itemA?.position).toBe(0);
      expect(itemB?.position).toBe(1);
    });

    consoleSpy.mockRestore();
  });

  it('should not mutate unrelated items in cache', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, position: body.position as number }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [
      makeTodo({ id: 'a', title: 'First', position: 0 }),
      makeTodo({ id: 'b', title: 'Second', position: 1 }),
      makeTodo({ id: 'c', title: 'Third', position: 2 }),
    ];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useReorderSibling(), { wrapper });

    act(() => {
      result.current.mutate({
        itemId: 'a',
        swapWithId: 'b',
        itemPosition: 0,
        swapWithPosition: 1,
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      const itemC = cached.find((t) => t.id === 'c');
      // Third item should remain untouched
      expect(itemC?.position).toBe(2);
      expect(itemC?.title).toBe('Third');
    });
  });

  it('should invalidate queries after settlement', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, position: body.position as number }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const todos = [makeTodo({ id: 'a', position: 0 }), makeTodo({ id: 'b', position: 1 })];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useReorderSibling(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        itemId: 'a',
        swapWithId: 'b',
        itemPosition: 0,
        swapWithPosition: 1,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['todos', 'list'],
      }),
    );

    invalidateSpy.mockRestore();
  });
});
