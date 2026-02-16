import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useTodos,
  useFlatTodos,
  useTodo,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodo,
} from '../useTodos';
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

/** Helper to create a mock todo for pre-populating cache (camelCase frontend shape) */
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
) {
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
    id: 'new-1',
    title: 'New',
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

describe('useTodos', () => {
  it('should fetch todos and return tree data', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTodos(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useFlatTodos', () => {
  it('should fetch flat list of todos', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlatTodos(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    if (result.current.data && result.current.data.length > 0) {
      expect(result.current.data[0]).toHaveProperty('parentId');
    }
  });
});

describe('useTodo', () => {
  it('should fetch a single todo by ID', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTodo('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe('1');
    expect(result.current.data?.title).toBe('First task');
  });

  it('should not fetch when ID is empty', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTodo(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateTodo', () => {
  it('should create a todo and return data', async () => {
    server.use(
      http.post(`${API_URL}/todos`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            data: apiTodo({ title: body.title, description: body.description }),
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(['todos', 'list', {}], []);

    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({ title: 'New Task' });
    });

    // Check the returned data (isSuccess may be idle after onSettled invalidates)
    expect(mutationResult).toBeDefined();
    expect((mutationResult as { title: string }).title).toBe('New Task');
  });

  it('should add optimistic todo to cache', async () => {
    server.use(
      http.post(`${API_URL}/todos`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            data: apiTodo({ title: body.title as string }),
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const existingTodos = [makeTodo({ id: '1', title: 'Existing' })];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, existingTodos);

    const { result } = renderHook(() => useCreateTodo(), { wrapper });

    act(() => {
      result.current.mutate({ title: 'Optimistic Task' });
    });

    // Check optimistic update was applied immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      // Either 2 (optimistic added) or more if refetch happened
      expect(cached?.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('useUpdateTodo', () => {
  it('should update a todo and return data', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, title: body.title as string }),
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTodo(), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        id: '1',
        input: { title: 'Updated Title' },
      });
    });

    expect(mutationResult).toBeDefined();
  });

  it('should optimistically update cache', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({ id: params.id as string, title: body.title as string }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [makeTodo({ id: '1', title: 'Original' })];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useUpdateTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: '1', input: { title: 'Updated' } });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      // Optimistic update should set title to 'Updated'
      expect(cached?.[0]?.title).toBe('Updated');
    });
  });
});

describe('useDeleteTodo', () => {
  it('should delete a todo', async () => {
    server.use(
      http.delete(`${API_URL}/todos/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    // mutateAsync on delete should resolve without throwing
    await act(async () => {
      await result.current.mutateAsync('2');
    });

    // After settlement, status may be idle due to onSettled invalidation
    // Just verify no error was thrown (the await above would throw)
  });

  it('should optimistically remove todo and descendants from cache', async () => {
    server.use(
      http.delete(`${API_URL}/todos/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [
      makeTodo({ id: '1', title: 'Parent', childCount: 1 }),
      makeTodo({ id: '3', title: 'Child', parentId: '1', position: 0 }),
      makeTodo({ id: '2', title: 'Other', position: 1 }),
    ];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      // Should remove '1' and its child '3', leaving only '2'
      expect(cached?.length).toBe(1);
      expect(cached?.[0]?.id).toBe('2');
    });
  });
});

describe('useToggleTodo', () => {
  it('should toggle todo completion', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({
            id: params.id as string,
            is_completed: body.is_completed,
            completed_at: body.is_completed ? new Date().toISOString() : null,
          }),
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({ id: '1', isCompleted: true });
    });

    expect(mutationResult).toBeDefined();
  });

  it('should optimistically toggle isCompleted and completedAt', async () => {
    server.use(
      http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTodo({
            id: params.id as string,
            is_completed: body.is_completed,
            completed_at: body.is_completed ? new Date().toISOString() : null,
          }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const todos = [makeTodo({ id: '1', title: 'Task', isCompleted: false, completedAt: null })];
    const queryKey = ['todos', 'list', {}];
    queryClient.setQueryData(queryKey, todos);

    const { result } = renderHook(() => useToggleTodo(), { wrapper });

    act(() => {
      result.current.mutate({ id: '1', isCompleted: true });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(queryKey)!;
      expect(cached?.[0]?.isCompleted).toBe(true);
      expect(cached?.[0]?.completedAt).not.toBeNull();
    });
  });
});
