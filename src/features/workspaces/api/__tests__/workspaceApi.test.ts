/**
 * Tests for Workspace API
 *
 * Tests the workspaceApi module including all workspace and member management endpoints.
 * Verifies snake_case to camelCase mapping for API responses.
 */

import { describe, it, expect } from 'vitest';
import { workspaceApi } from '../workspaceApi';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

describe('workspaceApi', () => {
  describe('getAll', () => {
    it('should fetch workspaces and map to camelCase', async () => {
      server.use(
        http.get(`${API_URL}/workspaces`, () =>
          HttpResponse.json({
            data: [
              {
                id: 'ws-1',
                name: 'Test Workspace',
                slug: 'test-workspace',
                description: 'A test workspace',
                created_by: 'user-1',
                member_count: 5,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
              },
              {
                id: 'ws-2',
                name: 'Another Workspace',
                slug: 'another-workspace',
                description: null,
                created_by: 'user-2',
                member_count: 2,
                created_at: '2024-01-03T00:00:00Z',
                updated_at: '2024-01-04T00:00:00Z',
              },
            ],
            meta: { total: 2 },
          }),
        ),
      );

      const result = await workspaceApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      const workspace = result[0];
      expect(workspace.id).toBe('ws-1');
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.slug).toBe('test-workspace');
      expect(workspace.description).toBe('A test workspace');
      expect(workspace.createdBy).toBe('user-1');
      expect(workspace.memberCount).toBe(5);
      expect(workspace.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(workspace.updatedAt).toBe('2024-01-02T00:00:00Z');

      // Should not have snake_case properties
      expect(workspace).not.toHaveProperty('created_by');
      expect(workspace).not.toHaveProperty('member_count');
      expect(workspace).not.toHaveProperty('created_at');
      expect(workspace).not.toHaveProperty('updated_at');
    });

    it('should handle empty workspaces list', async () => {
      server.use(
        http.get(`${API_URL}/workspaces`, () =>
          HttpResponse.json({ data: [], meta: { total: 0 } }),
        ),
      );

      const result = await workspaceApi.getAll();

      expect(result).toEqual([]);
    });

    it('should handle null description', async () => {
      server.use(
        http.get(`${API_URL}/workspaces`, () =>
          HttpResponse.json({
            data: [
              {
                id: 'ws-1',
                name: 'Workspace',
                slug: 'workspace',
                description: null,
                created_by: 'user-1',
                member_count: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            meta: { total: 1 },
          }),
        ),
      );

      const result = await workspaceApi.getAll();

      expect(result[0].description).toBeNull();
    });
  });

  describe('getById', () => {
    it('should fetch single workspace and map to camelCase', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:id`, ({ params }) =>
          HttpResponse.json({
            data: {
              id: params.id,
              name: 'Single Workspace',
              slug: 'single-workspace',
              description: 'Description',
              created_by: 'user-1',
              member_count: 3,
              is_personal: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          }),
        ),
      );

      const result = await workspaceApi.getById('ws-123');

      expect(result.id).toBe('ws-123');
      expect(result.name).toBe('Single Workspace');
      expect(result.slug).toBe('single-workspace');
      expect(result.createdBy).toBe('user-1');
      expect(result.memberCount).toBe(3);
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('member_count');
    });

    it('should throw for non-existent workspace', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:id`, () =>
          HttpResponse.json({ message: 'Workspace not found' }, { status: 404 }),
        ),
      );

      await expect(workspaceApi.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should send correct body and return mapped workspace', async () => {
      server.use(
        http.post(`${API_URL}/workspaces`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            name: 'New Workspace',
            description: 'New description',
          });

          return HttpResponse.json(
            {
              data: {
                id: 'ws-new',
                name: body.name,
                slug: 'new-workspace',
                description: body.description,
                created_by: 'user-1',
                member_count: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 },
          );
        }),
      );

      const result = await workspaceApi.create({
        name: 'New Workspace',
        description: 'New description',
      });

      expect(result.id).toBe('ws-new');
      expect(result.name).toBe('New Workspace');
      expect(result.description).toBe('New description');
      expect(result.createdBy).toBe('user-1');
      expect(result.memberCount).toBe(1);
    });

    it('should handle workspace creation without description', async () => {
      server.use(
        http.post(`${API_URL}/workspaces`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.description).toBeUndefined();

          return HttpResponse.json(
            {
              data: {
                id: 'ws-new',
                name: body.name,
                slug: 'new-workspace',
                description: null,
                created_by: 'user-1',
                member_count: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 },
          );
        }),
      );

      const result = await workspaceApi.create({ name: 'New Workspace' });

      expect(result.name).toBe('New Workspace');
      expect(result.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should send only provided fields and return mapped workspace', async () => {
      server.use(
        http.patch(`${API_URL}/workspaces/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(Object.keys(body)).toEqual(['name']);
          expect(body.name).toBe('Updated Name');

          return HttpResponse.json({
            data: {
              id: params.id,
              name: body.name,
              slug: 'updated-workspace',
              description: 'Old description',
              created_by: 'user-1',
              member_count: 3,
              is_personal: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-03T00:00:00Z',
            },
          });
        }),
      );

      const result = await workspaceApi.update('ws-1', { name: 'Updated Name' });

      expect(result.id).toBe('ws-1');
      expect(result.name).toBe('Updated Name');
      expect(result.updatedAt).toBe('2024-01-03T00:00:00Z');
    });

    it('should handle updating only description', async () => {
      server.use(
        http.patch(`${API_URL}/workspaces/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(Object.keys(body)).toEqual(['description']);
          expect(body.description).toBe('New description');

          return HttpResponse.json({
            data: {
              id: params.id,
              name: 'Workspace Name',
              slug: 'workspace-name',
              description: body.description,
              created_by: 'user-1',
              member_count: 3,
              is_personal: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-03T00:00:00Z',
            },
          });
        }),
      );

      const result = await workspaceApi.update('ws-1', { description: 'New description' });

      expect(result.description).toBe('New description');
    });

    it('should handle updating both fields', async () => {
      server.use(
        http.patch(`${API_URL}/workspaces/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(Object.keys(body).sort()).toEqual(['description', 'name']);

          return HttpResponse.json({
            data: {
              id: params.id,
              name: body.name,
              slug: 'both-updated',
              description: body.description,
              created_by: 'user-1',
              member_count: 3,
              is_personal: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-03T00:00:00Z',
            },
          });
        }),
      );

      const result = await workspaceApi.update('ws-1', {
        name: 'Both Updated',
        description: 'Both description',
      });

      expect(result.name).toBe('Both Updated');
      expect(result.description).toBe('Both description');
    });
  });

  describe('remove', () => {
    it('should resolve without error on successful deletion', async () => {
      server.use(
        http.delete(`${API_URL}/workspaces/:id`, () => new HttpResponse(null, { status: 204 })),
      );

      await expect(workspaceApi.remove('ws-1')).resolves.toBeUndefined();
    });

    it('should throw on failed deletion', async () => {
      server.use(
        http.delete(`${API_URL}/workspaces/:id`, () =>
          HttpResponse.json({ message: 'Cannot delete workspace' }, { status: 403 }),
        ),
      );

      await expect(workspaceApi.remove('ws-1')).rejects.toThrow();
    });
  });

  describe('getMembers', () => {
    it('should fetch members and map to camelCase', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:workspaceId/members`, () =>
          HttpResponse.json({
            data: [
              {
                user_id: 'user-1',
                email: 'owner@example.com',
                display_name: 'Owner User',
                avatar_url: 'https://example.com/avatar1.jpg',
                role: 'owner',
                joined_at: '2024-01-01T00:00:00Z',
              },
              {
                user_id: 'user-2',
                email: 'member@example.com',
                display_name: null,
                avatar_url: null,
                role: 'member',
                joined_at: '2024-01-02T00:00:00Z',
              },
            ],
            meta: { total: 2 },
          }),
        ),
      );

      const result = await workspaceApi.getMembers('ws-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      const member = result[0];
      expect(member.userId).toBe('user-1');
      expect(member.email).toBe('owner@example.com');
      expect(member.displayName).toBe('Owner User');
      expect(member.avatarUrl).toBe('https://example.com/avatar1.jpg');
      expect(member.role).toBe('owner');
      expect(member.joinedAt).toBe('2024-01-01T00:00:00Z');

      // Should not have snake_case properties
      expect(member).not.toHaveProperty('user_id');
      expect(member).not.toHaveProperty('display_name');
      expect(member).not.toHaveProperty('avatar_url');
      expect(member).not.toHaveProperty('joined_at');

      // Second member with null fields
      const member2 = result[1];
      expect(member2.displayName).toBeNull();
      expect(member2.avatarUrl).toBeNull();
    });

    it('should handle empty members list', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:workspaceId/members`, () =>
          HttpResponse.json({ data: [], meta: { total: 0 } }),
        ),
      );

      const result = await workspaceApi.getMembers('ws-1');

      expect(result).toEqual([]);
    });
  });

  describe('addMember', () => {
    it('should send correct body with user_id and role, return mapped member', async () => {
      server.use(
        http.post(`${API_URL}/workspaces/:workspaceId/members`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            user_id: 'user-2',
            role: 'admin',
          });

          return HttpResponse.json(
            {
              data: {
                user_id: body.user_id,
                email: 'newmember@example.com',
                display_name: 'New Member',
                avatar_url: null,
                role: body.role,
                joined_at: '2024-01-05T00:00:00Z',
              },
            },
            { status: 201 },
          );
        }),
      );

      const result = await workspaceApi.addMember('ws-1', 'user-2', 'admin');

      expect(result.userId).toBe('user-2');
      expect(result.email).toBe('newmember@example.com');
      expect(result.role).toBe('admin');
      expect(result.displayName).toBe('New Member');
      expect(result).not.toHaveProperty('user_id');
    });
  });

  describe('updateMemberRole', () => {
    it('should send role and return mapped member', async () => {
      server.use(
        http.patch(`${API_URL}/workspaces/:workspaceId/members/:userId`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({ role: 'viewer' });

          return HttpResponse.json({
            data: {
              user_id: 'user-2',
              email: 'member@example.com',
              display_name: 'Member',
              avatar_url: null,
              role: body.role,
              joined_at: '2024-01-02T00:00:00Z',
            },
          });
        }),
      );

      const result = await workspaceApi.updateMemberRole('ws-1', 'user-2', 'viewer');

      expect(result.userId).toBe('user-2');
      expect(result.role).toBe('viewer');
      expect(result).not.toHaveProperty('user_id');
    });
  });

  describe('removeMember', () => {
    it('should resolve without error on successful removal', async () => {
      server.use(
        http.delete(
          `${API_URL}/workspaces/:workspaceId/members/:userId`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      await expect(workspaceApi.removeMember('ws-1', 'user-2')).resolves.toBeUndefined();
    });

    it('should throw on failed removal', async () => {
      server.use(
        http.delete(`${API_URL}/workspaces/:workspaceId/members/:userId`, () =>
          HttpResponse.json({ message: 'Cannot remove member' }, { status: 403 }),
        ),
      );

      await expect(workspaceApi.removeMember('ws-1', 'user-2')).rejects.toThrow();
    });
  });

  describe('transferOwnership', () => {
    it('should send new_owner_id and resolve without error', async () => {
      server.use(
        http.post(`${API_URL}/workspaces/:workspaceId/transfer-ownership`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({ new_owner_id: 'user-2' });

          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(workspaceApi.transferOwnership('ws-1', 'user-2')).resolves.toBeUndefined();
    });

    it('should throw on failed transfer', async () => {
      server.use(
        http.post(`${API_URL}/workspaces/:workspaceId/transfer-ownership`, () =>
          HttpResponse.json({ message: 'Cannot transfer ownership' }, { status: 403 }),
        ),
      );

      await expect(workspaceApi.transferOwnership('ws-1', 'user-2')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw on network error', async () => {
      server.use(http.get(`${API_URL}/workspaces`, () => HttpResponse.error()));

      await expect(workspaceApi.getAll()).rejects.toThrow();
    });

    it('should throw on 500 error', async () => {
      server.use(
        http.get(`${API_URL}/workspaces`, () =>
          HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
        ),
      );

      await expect(workspaceApi.getAll()).rejects.toThrow();
    });
  });
});
