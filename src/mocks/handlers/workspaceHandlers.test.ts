/**
 * Integration tests for workspace MSW handlers
 *
 * Verifies that the MSW handlers correctly intercept and respond to API requests.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { workspaceHandlers } from './workspaceHandlers';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;
const server = setupServer(...workspaceHandlers);

describe('Workspace MSW Handlers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Workspaces API', () => {
    it('should return list of workspaces', async () => {
      const response = await fetch(`${API_URL}/workspaces`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.meta).toHaveProperty('total');
    });

    it('should create a new workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Test Workspace',
          description: 'Test description',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data).toHaveProperty('id');
      expect(json.data.name).toBe('New Test Workspace');
      expect(json.data.description).toBe('Test description');
    });

    it('should get workspace by ID', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-1`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveProperty('id', 'ws-1');
      expect(json.data).toHaveProperty('name');
    });

    it('should return 404 for non-existent workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces/nonexistent`);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('error_code');
    });

    it('should update workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Workspace Name',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.name).toBe('Updated Workspace Name');
    });

    it('should delete workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-1`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Members API', () => {
    it('should return list of workspace members', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/members`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it('should add member to workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user-99',
          email: 'newuser@example.com',
          role: 'member',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data).toHaveProperty('user_id', 'user-99');
      expect(json.data).toHaveProperty('email', 'newuser@example.com');
    });

    it('should update member role', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/members/user-2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'owner',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.role).toBe('owner');
    });

    it('should remove member from workspace', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/members/user-3`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Invitations API', () => {
    it('should return list of workspace invitations', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/invitations`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
    });

    it('should create invitation', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invite@example.com',
          role: 'member',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data).toHaveProperty('id');
      expect(json.data.email).toBe('invite@example.com');
      expect(json.data.status).toBe('pending');
    });

    it('should return pending invitations', async () => {
      const response = await fetch(`${API_URL}/invitations/pending`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
    });
  });

  describe('Groups API', () => {
    it('should return list of workspace groups', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/groups`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
    });

    it('should create group', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Group',
          description: 'Test group',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data).toHaveProperty('id');
      expect(json.data.name).toBe('New Group');
    });

    it('should get group by ID', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/groups/grp-1`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveProperty('id', 'grp-1');
    });

    it('should update group', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/groups/grp-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Group Name',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.name).toBe('Updated Group Name');
    });

    it('should return list of group members', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/groups/grp-1/members`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
    });
  });

  describe('Notifications API', () => {
    it('should return list of notifications', async () => {
      const response = await fetch(`${API_URL}/notifications`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it('should return unread count', async () => {
      const response = await fetch(`${API_URL}/notifications/unread-count`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveProperty('count');
      expect(typeof json.data.count).toBe('number');
    });

    it('should mark notification as read', async () => {
      const response = await fetch(`${API_URL}/notifications/notif-1/read`, {
        method: 'PATCH',
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.is_read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.success).toBe(true);
    });

    it('should return notification preferences', async () => {
      const response = await fetch(`${API_URL}/notifications/preferences`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveProperty('workspace_invitation');
      expect(json.data).toHaveProperty('task_assigned');
    });

    it('should update notification preferences', async () => {
      const response = await fetch(`${API_URL}/notifications/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_completed: { in_app: false, email: false },
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.task_completed).toEqual({ in_app: false, email: false });
    });
  });

  describe('Activity API', () => {
    it('should return workspace activity', async () => {
      const response = await fetch(`${API_URL}/workspaces/ws-2/activity`);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data[0]).toHaveProperty('actor_name');
      expect(json.data[0]).toHaveProperty('action');
    });
  });
});
