import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useAddTagToTodo,
  useRemoveTagFromTodo,
} from '../useTags';
import type { Tag } from '../../types/tag';

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

/** Helper to create a mock tag for pre-populating cache (camelCase frontend shape) */
function makeTag(
  overrides: Partial<{
    id: string;
    name: string;
    colorHex: string;
    usageCount: number;
    createdAt: string;
  }> = {},
): Tag {
  return {
    id: 'tag-1',
    name: 'Work',
    colorHex: '#3b82f6',
    usageCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Helper to create a snake_case API response shape */
function apiTag(overrides: Record<string, unknown> = {}) {
  return {
    id: 'new-tag',
    name: 'New Tag',
    color_hex: '#6b7280',
    usage_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('useTags', () => {
  it('should fetch tags and return data', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });

  it('should use workspaceId filter when provided', async () => {
    server.use(
      http.get(`${API_URL}/tags`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('workspace_id')).toBe('ws-1');
        return HttpResponse.json({
          data: [
            {
              id: 'tag-ws',
              name: 'Workspace Tag',
              color_hex: '#3b82f6',
              usage_count: 1,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTags('ws-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Workspace Tag');
  });

  it('should handle empty tags list', async () => {
    server.use(http.get(`${API_URL}/tags`, () => HttpResponse.json({ data: [] })));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateTag', () => {
  it('should create a tag and return data', async () => {
    server.use(
      http.post(`${API_URL}/tags`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            data: apiTag({ name: body.name, color_hex: body.color_hex }),
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(['tags', 'list', undefined], []);

    const { result } = renderHook(() => useCreateTag(), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        name: 'New Tag',
        colorHex: '#ef4444',
      });
    });

    // Check the returned data
    expect(mutationResult).toBeDefined();
    expect((mutationResult as Tag).name).toBe('New Tag');
    expect((mutationResult as Tag).colorHex).toBe('#ef4444');
  });

  it('should invalidate tags queries after creation', async () => {
    server.use(
      http.post(`${API_URL}/tags`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            data: apiTag({ name: body.name }),
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const existingTags = [makeTag({ id: 'tag-1', name: 'Existing' })];
    queryClient.setQueryData(['tags', 'list', undefined], existingTags);

    const { result } = renderHook(() => useCreateTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Another Tag' });
    });

    // After mutation settles, the query should be marked for refetch
    // The cache should be invalidated (but we can't easily verify refetch without triggering it)
    await waitFor(() => {
      // Check that the mutation completed
      const queryState = queryClient.getQueryState(['tags', 'list', undefined]);
      expect(queryState?.isInvalidated).toBe(true);
    });
  });
});

describe('useUpdateTag', () => {
  it('should update a tag and return data', async () => {
    server.use(
      http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTag({
            id: params.id as string,
            name: body.name,
            color_hex: body.color_hex,
          }),
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTag(), { wrapper });

    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        id: 'tag-1',
        input: { name: 'Updated Tag', colorHex: '#22c55e' },
      });
    });

    expect(mutationResult).toBeDefined();
    expect((mutationResult as Tag).name).toBe('Updated Tag');
    expect((mutationResult as Tag).colorHex).toBe('#22c55e');
  });

  it('should invalidate tags queries after update', async () => {
    server.use(
      http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: apiTag({ id: params.id as string, name: body.name }),
        });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const tags = [makeTag({ id: 'tag-1', name: 'Original' })];
    queryClient.setQueryData(['tags', 'list', undefined], tags);

    const { result } = renderHook(() => useUpdateTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'tag-1',
        input: { name: 'Updated' },
      });
    });

    await waitFor(() => {
      const queryState = queryClient.getQueryState(['tags', 'list', undefined]);
      expect(queryState?.isInvalidated).toBe(true);
    });
  });

  it('should update only name field', async () => {
    server.use(
      http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(['name']);
        return HttpResponse.json({
          data: apiTag({ id: params.id as string, name: body.name }),
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'tag-1',
        input: { name: 'Name Only' },
      });
    });
  });

  it('should update only colorHex field', async () => {
    server.use(
      http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(['color_hex']);
        return HttpResponse.json({
          data: apiTag({ id: params.id as string, color_hex: body.color_hex }),
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'tag-1',
        input: { colorHex: '#ef4444' },
      });
    });
  });
});

describe('useDeleteTag', () => {
  it('should delete a tag', async () => {
    server.use(
      http.delete(`${API_URL}/tags/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteTag(), { wrapper });

    // mutateAsync on delete should resolve without throwing
    await act(async () => {
      await result.current.mutateAsync('tag-1');
    });

    // Verify no error was thrown (the await above would throw)
  });

  it('should optimistically remove tag from cache', async () => {
    server.use(
      http.delete(`${API_URL}/tags/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const tags = [
      makeTag({ id: 'tag-1', name: 'To Delete' }),
      makeTag({ id: 'tag-2', name: 'Keep' }),
    ];
    queryClient.setQueryData(['tags', 'list'], tags);

    const { result } = renderHook(() => useDeleteTag(), { wrapper });

    act(() => {
      result.current.mutate('tag-1');
    });

    // Check optimistic update removed the tag immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<Tag[]>(['tags', 'list'])!;
      expect(cached?.length).toBe(1);
      expect(cached?.[0]?.id).toBe('tag-2');
    });
  });

  it('should restore previous tags on error', async () => {
    server.use(
      http.delete(`${API_URL}/tags/:id`, () => {
        return HttpResponse.json({ message: 'Cannot delete tag in use' }, { status: 400 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const tags = [
      makeTag({ id: 'tag-1', name: 'To Delete' }),
      makeTag({ id: 'tag-2', name: 'Keep' }),
    ];
    queryClient.setQueryData(['tags', 'list'], tags);

    const { result } = renderHook(() => useDeleteTag(), { wrapper });

    try {
      await act(async () => {
        await result.current.mutateAsync('tag-1');
      });
    } catch {
      // Expected error
    }

    // Check that tags were restored after error
    await waitFor(() => {
      const cached = queryClient.getQueryData<Tag[]>(['tags', 'list'])!;
      expect(cached?.length).toBe(2);
      expect(cached?.find((t) => t.id === 'tag-1')).toBeDefined();
    });
  });

  it('should invalidate tags queries after successful delete', async () => {
    server.use(
      http.delete(`${API_URL}/tags/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    const tags = [makeTag({ id: 'tag-1', name: 'To Delete' })];
    queryClient.setQueryData(['tags', 'list'], tags);

    const { result } = renderHook(() => useDeleteTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tag-1');
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(['tags', 'list'])?.isInvalidated).toBe(true);
    });
  });
});

describe('useAddTagToTodo', () => {
  it('should add tag to todo', async () => {
    server.use(
      http.post(`${API_URL}/todos/:todoId/tags`, async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(params.todoId).toBe('todo-1');
        expect(body).toHaveProperty('tag_id', 'tag-1');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddTagToTodo(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ todoId: 'todo-1', tagId: 'tag-1' });
    });

    // Verify no error was thrown
  });

  it('should invalidate todo queries after adding tag', async () => {
    server.use(
      http.post(`${API_URL}/todos/:todoId/tags`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    // Pre-populate a todo query
    queryClient.setQueryData(['todos', 'list', {}], []);

    const { result } = renderHook(() => useAddTagToTodo(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ todoId: 'todo-1', tagId: 'tag-1' });
    });

    await waitFor(() => {
      // Check that todo queries were invalidated
      expect(queryClient.getQueryState(['todos', 'list', {}])?.isInvalidated).toBe(true);
    });
  });
});

describe('useRemoveTagFromTodo', () => {
  it('should remove tag from todo', async () => {
    server.use(
      http.delete(`${API_URL}/todos/:todoId/tags/:tagId`, ({ params }) => {
        expect(params.todoId).toBe('todo-1');
        expect(params.tagId).toBe('tag-1');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRemoveTagFromTodo(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ todoId: 'todo-1', tagId: 'tag-1' });
    });

    // Verify no error was thrown
  });

  it('should invalidate todo queries after removing tag', async () => {
    server.use(
      http.delete(`${API_URL}/todos/:todoId/tags/:tagId`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper, queryClient } = createWrapper();
    // Pre-populate a todo query
    queryClient.setQueryData(['todos', 'list', {}], []);

    const { result } = renderHook(() => useRemoveTagFromTodo(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ todoId: 'todo-1', tagId: 'tag-1' });
    });

    await waitFor(() => {
      // Check that todo queries were invalidated
      expect(queryClient.getQueryState(['todos', 'list', {}])?.isInvalidated).toBe(true);
    });
  });
});
