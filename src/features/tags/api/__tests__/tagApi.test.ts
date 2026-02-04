import { describe, it, expect } from 'vitest';
import { tagApi } from '../tagApi';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

describe('tagApi', () => {
  describe('getAll', () => {
    it('should fetch tags and map to camelCase', async () => {
      const result = await tagApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const tag = result[0];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('name');
      expect(tag).toHaveProperty('colorHex');
      expect(tag).toHaveProperty('usageCount');
      expect(tag).toHaveProperty('createdAt');
      // Should not have snake_case properties
      expect(tag).not.toHaveProperty('color_hex');
      expect(tag).not.toHaveProperty('usage_count');
      expect(tag).not.toHaveProperty('created_at');
    });

    it('should handle workspaceId parameter', async () => {
      server.use(
        http.get(`${API_URL}/tags`, ({ request }) => {
          const url = new URL(request.url);
          const workspaceId = url.searchParams.get('workspace_id');
          expect(workspaceId).toBe('ws-1');
          return HttpResponse.json({
            data: [
              {
                id: 'tag-1',
                name: 'Workspace Tag',
                color_hex: '#3b82f6',
                usage_count: 1,
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
          });
        })
      );

      const result = await tagApi.getAll('ws-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Workspace Tag');
    });

    it('should handle empty result', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () => HttpResponse.json({ data: [] }))
      );

      const result = await tagApi.getAll();
      expect(result).toEqual([]);
    });

    it('should map tags without optional fields', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () =>
          HttpResponse.json({
            data: [
              {
                id: 'tag-1',
                name: 'Minimal Tag',
                color_hex: '#6b7280',
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
          })
        )
      );

      const result = await tagApi.getAll();
      expect(result[0]).toEqual({
        id: 'tag-1',
        name: 'Minimal Tag',
        colorHex: '#6b7280',
        usageCount: undefined,
        createdAt: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('create', () => {
    it('should create a tag and return camelCase response', async () => {
      const result = await tagApi.create({ name: 'New Tag', colorHex: '#ef4444' });

      expect(result.name).toBe('New Tag');
      expect(result.colorHex).toBe('#ef4444');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
    });

    it('should send color_hex in snake_case', async () => {
      server.use(
        http.post(`${API_URL}/tags`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('color_hex', '#22c55e');
          expect(body).not.toHaveProperty('colorHex');
          return HttpResponse.json(
            {
              data: {
                id: 'new-tag',
                name: body.name as string,
                color_hex: body.color_hex as string,
                usage_count: 0,
                created_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      const result = await tagApi.create({ name: 'Test Tag', colorHex: '#22c55e' });
      expect(result.colorHex).toBe('#22c55e');
    });

    it('should send workspace_id when provided', async () => {
      server.use(
        http.post(`${API_URL}/tags`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('workspace_id', 'ws-1');
          return HttpResponse.json(
            {
              data: {
                id: 'new-tag',
                name: body.name as string,
                color_hex: '#6b7280',
                usage_count: 0,
                created_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      await tagApi.create({ name: 'Workspace Tag' }, 'ws-1');
    });

    it('should create tag without colorHex (server provides default)', async () => {
      server.use(
        http.post(`${API_URL}/tags`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).not.toHaveProperty('color_hex');
          return HttpResponse.json(
            {
              data: {
                id: 'new-tag',
                name: body.name as string,
                color_hex: '#6b7280',
                usage_count: 0,
                created_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      const result = await tagApi.create({ name: 'Default Color' });
      expect(result.colorHex).toBe('#6b7280');
    });
  });

  describe('update', () => {
    it('should update a tag and return camelCase response', async () => {
      server.use(
        http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            data: {
              id: params.id as string,
              name: body.name as string,
              color_hex: '#3b82f6',
              usage_count: 2,
              created_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      const result = await tagApi.update('tag-1', { name: 'Updated Tag' });
      expect(result.name).toBe('Updated Tag');
      expect(result).toHaveProperty('colorHex');
      expect(result).not.toHaveProperty('color_hex');
    });

    it('should send only provided fields in snake_case', async () => {
      server.use(
        http.patch(`${API_URL}/tags/:id`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(Object.keys(body)).toEqual(['name']);
          expect(body.name).toBe('Name Only');
          return HttpResponse.json({
            data: {
              id: 'tag-1',
              name: body.name as string,
              color_hex: '#3b82f6',
              usage_count: 2,
              created_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      await tagApi.update('tag-1', { name: 'Name Only' });
    });

    it('should send color_hex when updating color', async () => {
      server.use(
        http.patch(`${API_URL}/tags/:id`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('color_hex', '#ef4444');
          expect(body).not.toHaveProperty('colorHex');
          return HttpResponse.json({
            data: {
              id: 'tag-1',
              name: 'Tag',
              color_hex: body.color_hex as string,
              usage_count: 2,
              created_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      const result = await tagApi.update('tag-1', { colorHex: '#ef4444' });
      expect(result.colorHex).toBe('#ef4444');
    });

    it('should update both name and color', async () => {
      server.use(
        http.patch(`${API_URL}/tags/:id`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('name', 'Updated');
          expect(body).toHaveProperty('color_hex', '#22c55e');
          return HttpResponse.json({
            data: {
              id: 'tag-1',
              name: body.name as string,
              color_hex: body.color_hex as string,
              usage_count: 2,
              created_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      const result = await tagApi.update('tag-1', { name: 'Updated', colorHex: '#22c55e' });
      expect(result.name).toBe('Updated');
      expect(result.colorHex).toBe('#22c55e');
    });
  });

  describe('delete', () => {
    it('should delete a tag without throwing', async () => {
      await expect(tagApi.delete('tag-1')).resolves.toBeUndefined();
    });

    it('should handle non-existent tag gracefully', async () => {
      server.use(
        http.delete(`${API_URL}/tags/:id`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(tagApi.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('addToTodo', () => {
    it('should add tag to todo with tag_id in snake_case', async () => {
      server.use(
        http.post(`${API_URL}/todos/:todoId/tags`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(params.todoId).toBe('todo-1');
          expect(body).toHaveProperty('tag_id', 'tag-1');
          expect(body).not.toHaveProperty('tagId');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(tagApi.addToTodo('todo-1', 'tag-1')).resolves.toBeUndefined();
    });
  });

  describe('removeFromTodo', () => {
    it('should remove tag from todo', async () => {
      server.use(
        http.delete(`${API_URL}/todos/:todoId/tags/:tagId`, ({ params }) => {
          expect(params.todoId).toBe('todo-1');
          expect(params.tagId).toBe('tag-1');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(tagApi.removeFromTodo('todo-1', 'tag-1')).resolves.toBeUndefined();
    });
  });

  describe('getForTodo', () => {
    it('should fetch tags for a specific todo and map to camelCase', async () => {
      server.use(
        http.get(`${API_URL}/todos/:todoId/tags`, ({ params }) => {
          expect(params.todoId).toBe('todo-1');
          return HttpResponse.json({
            data: [
              {
                id: 'tag-1',
                name: 'Work',
                color_hex: '#3b82f6',
                usage_count: 2,
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 'tag-2',
                name: 'Urgent',
                color_hex: '#ef4444',
                usage_count: 5,
                created_at: '2024-01-02T00:00:00Z',
              },
            ],
          });
        })
      );

      const result = await tagApi.getForTodo('todo-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('colorHex');
      expect(result[1]).toHaveProperty('colorHex');
      expect(result[0]).not.toHaveProperty('color_hex');
    });

    it('should handle todo with no tags', async () => {
      server.use(
        http.get(`${API_URL}/todos/:todoId/tags`, () =>
          HttpResponse.json({ data: [] })
        )
      );

      const result = await tagApi.getForTodo('todo-without-tags');
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should throw on network error', async () => {
      server.use(http.get(`${API_URL}/tags`, () => HttpResponse.error()));
      await expect(tagApi.getAll()).rejects.toThrow();
    });

    it('should throw on 500 error', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );
      await expect(tagApi.getAll()).rejects.toThrow();
    });

    it('should throw on 404 error for update', async () => {
      server.use(
        http.patch(`${API_URL}/tags/:id`, () =>
          HttpResponse.json(
            { error_code: 'TAG_NOT_FOUND', message: 'Tag not found' },
            { status: 404 }
          )
        )
      );
      await expect(tagApi.update('non-existent', { name: 'Test' })).rejects.toThrow();
    });
  });
});
