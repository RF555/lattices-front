import { describe, it, expect } from 'vitest';
import { todoApi } from '../todoApi';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

describe('todoApi', () => {
  describe('getAll', () => {
    it('should fetch todos and map to camelCase', async () => {
      const result = await todoApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const todo = result[0];
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('isCompleted');
      expect(todo).toHaveProperty('parentId');
      expect(todo).toHaveProperty('childCount');
      expect(todo).toHaveProperty('completedChildCount');
      expect(todo).toHaveProperty('createdAt');
      expect(todo).toHaveProperty('updatedAt');
      // Should not have snake_case properties
      expect(todo).not.toHaveProperty('is_completed');
      expect(todo).not.toHaveProperty('parent_id');
    });

    it('should handle empty result', async () => {
      server.use(
        http.get(`${API_URL}/todos`, () =>
          HttpResponse.json({ data: [], meta: { total: 0, root_count: 0 } })
        )
      );
      const result = await todoApi.getAll();
      expect(result).toEqual([]);
    });

    it('should map tags with camelCase colorHex', async () => {
      server.use(
        http.get(`${API_URL}/todos`, () =>
          HttpResponse.json({
            data: [{
              id: '1', title: 'With tags', is_completed: false, parent_id: null,
              position: 0, description: null, completed_at: null,
              child_count: 0, completed_child_count: 0,
              tags: [{ id: 't1', name: 'Tag', color_hex: '#ff0000' }],
              created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
            }],
            meta: { total: 1, root_count: 1 },
          })
        )
      );

      const result = await todoApi.getAll();
      expect(result[0].tags[0]).toEqual({ id: 't1', name: 'Tag', colorHex: '#ff0000' });
    });

    it('should handle null tags as empty array', async () => {
      server.use(
        http.get(`${API_URL}/todos`, () =>
          HttpResponse.json({
            data: [{
              id: '1', title: 'No tags', is_completed: false, parent_id: null,
              position: 0, description: null, completed_at: null,
              child_count: 0, completed_child_count: 0, tags: null,
              created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
            }],
            meta: { total: 1, root_count: 1 },
          })
        )
      );

      const result = await todoApi.getAll();
      expect(result[0].tags).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch a single todo by ID', async () => {
      const result = await todoApi.getById('1');
      expect(result.id).toBe('1');
      expect(result).toHaveProperty('isCompleted');
      expect(result).toHaveProperty('parentId');
    });

    it('should throw for non-existent todo', async () => {
      await expect(todoApi.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a todo and return camelCase response', async () => {
      const result = await todoApi.create({ title: 'New Todo', description: 'Desc' });
      expect(result.title).toBe('New Todo');
      expect(result.description).toBe('Desc');
      expect(result.isCompleted).toBe(false);
    });

    it('should send parent_id in snake_case', async () => {
      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('parent_id', 'parent-1');
          expect(body).not.toHaveProperty('parentId');
          return HttpResponse.json({
            data: {
              id: 'new', title: body.title, description: null,
              is_completed: false, parent_id: body.parent_id, position: 0,
              completed_at: null, child_count: 0, completed_child_count: 0,
              tags: [], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
            },
          }, { status: 201 });
        })
      );

      const result = await todoApi.create({ title: 'Subtask', parentId: 'parent-1' });
      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('update', () => {
    it('should update and return camelCase response', async () => {
      const result = await todoApi.update('1', { title: 'Updated' });
      expect(result).toHaveProperty('isCompleted');
    });

    it('should send is_completed in snake_case', async () => {
      server.use(
        http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toHaveProperty('is_completed', true);
          expect(body).not.toHaveProperty('isCompleted');
          return HttpResponse.json({
            data: {
              id: params.id, title: 'Test', is_completed: true, parent_id: null,
              position: 0, description: null, completed_at: '2024-01-01T00:00:00Z',
              child_count: 0, completed_child_count: 0, tags: [],
              created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      await todoApi.update('1', { isCompleted: true });
    });

    it('should only send provided fields', async () => {
      server.use(
        http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(Object.keys(body)).toEqual(['title']);
          return HttpResponse.json({
            data: {
              id: params.id, title: body.title, is_completed: false, parent_id: null,
              position: 0, description: null, completed_at: null,
              child_count: 0, completed_child_count: 0, tags: [],
              created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      await todoApi.update('1', { title: 'Only title' });
    });
  });

  describe('delete', () => {
    it('should delete without throwing', async () => {
      await expect(todoApi.delete('1')).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw on network error', async () => {
      server.use(http.get(`${API_URL}/todos`, () => HttpResponse.error()));
      await expect(todoApi.getAll()).rejects.toThrow();
    });

    it('should throw on 500 error', async () => {
      server.use(
        http.get(`${API_URL}/todos`, () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );
      await expect(todoApi.getAll()).rejects.toThrow();
    });
  });
});
