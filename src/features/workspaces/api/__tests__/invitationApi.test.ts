/**
 * Tests for Invitation API
 *
 * Tests the invitationApi module including:
 * - createInvitation: returns InvitationCreatedResult with token
 * - acceptInvitation: token-based acceptance, returns AcceptInvitationResult
 * - acceptInvitationById: ID-based acceptance, returns AcceptInvitationResult
 * - getWorkspaceInvitations: lists workspace invitations
 * - getPendingInvitations: lists user's pending invitations
 * - revokeInvitation: deletes an invitation
 */

import { describe, it, expect } from 'vitest';
import { invitationApi } from '../invitationApi';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

const mockApiInvitation = {
  id: 'inv-1',
  workspace_id: 'ws-1',
  workspace_name: 'Test Workspace',
  email: 'invitee@example.com',
  role: 'member' as const,
  invited_by_name: 'Admin User',
  status: 'pending' as const,
  created_at: '2026-01-01T00:00:00Z',
  expires_at: '2026-01-08T00:00:00Z',
};

describe('invitationApi', () => {
  describe('createInvitation', () => {
    it('should return InvitationCreatedResult with invitation and token', async () => {
      server.use(
        http.post(`${API_URL}/workspaces/:id/invitations`, () =>
          HttpResponse.json(
            { data: mockApiInvitation, token: 'raw-secret-token-xyz' },
            { status: 201 }
          )
        )
      );

      const result = await invitationApi.createInvitation('ws-1', 'invitee@example.com', 'member');

      expect(result.token).toBe('raw-secret-token-xyz');
      expect(result.invitation).toBeDefined();
      expect(result.invitation.id).toBe('inv-1');
      expect(result.invitation.workspaceId).toBe('ws-1');
      expect(result.invitation.email).toBe('invitee@example.com');
      expect(result.invitation.workspaceName).toBe('Test Workspace');
    });

    it('should map snake_case fields to camelCase', async () => {
      server.use(
        http.post(`${API_URL}/workspaces/:id/invitations`, () =>
          HttpResponse.json(
            { data: mockApiInvitation, token: 'tok' },
            { status: 201 }
          )
        )
      );

      const result = await invitationApi.createInvitation('ws-1', 'test@x.com', 'member');

      expect(result.invitation.workspaceId).toBe('ws-1');
      expect(result.invitation.workspaceName).toBe('Test Workspace');
      expect(result.invitation.invitedByName).toBe('Admin User');
      expect(result.invitation.createdAt).toBe('2026-01-01T00:00:00Z');
      expect(result.invitation.expiresAt).toBe('2026-01-08T00:00:00Z');
    });
  });

  describe('acceptInvitation (token-based)', () => {
    it('should send token in body and return AcceptInvitationResult', async () => {
      server.use(
        http.post(`${API_URL}/invitations/accept`, () =>
          HttpResponse.json({
            workspace_id: 'ws-1',
            workspace_name: 'Test Workspace',
            role: 'member',
            message: 'Invitation accepted successfully',
          })
        )
      );

      const result = await invitationApi.acceptInvitation('raw-secret-token');

      expect(result.workspaceId).toBe('ws-1');
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.role).toBe('member');
    });

    it('should map workspace_id to workspaceId', async () => {
      server.use(
        http.post(`${API_URL}/invitations/accept`, () =>
          HttpResponse.json({
            workspace_id: 'ws-456',
            workspace_name: 'My Team',
            role: 'admin',
            message: 'ok',
          })
        )
      );

      const result = await invitationApi.acceptInvitation('some-token');

      expect(result.workspaceId).toBe('ws-456');
      expect(result.workspaceName).toBe('My Team');
      expect(result.role).toBe('admin');
    });
  });

  describe('acceptInvitationById (ID-based)', () => {
    it('should POST to /invitations/{id}/accept with no body', async () => {
      let capturedUrl = '';
      server.use(
        http.post(`${API_URL}/invitations/:invitationId/accept`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            workspace_id: 'ws-1',
            workspace_name: 'Test Workspace',
            role: 'member',
            message: 'Invitation accepted successfully',
          });
        })
      );

      const result = await invitationApi.acceptInvitationById('inv-123-uuid');

      expect(capturedUrl).toContain('/invitations/inv-123-uuid/accept');
      expect(result.workspaceId).toBe('ws-1');
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.role).toBe('member');
    });

    it('should return AcceptInvitationResult with correct mapping', async () => {
      server.use(
        http.post(`${API_URL}/invitations/:invitationId/accept`, () =>
          HttpResponse.json({
            workspace_id: 'ws-789',
            workspace_name: 'Dev Team',
            role: 'viewer',
            message: 'ok',
          })
        )
      );

      const result = await invitationApi.acceptInvitationById('inv-xyz');

      expect(result.workspaceId).toBe('ws-789');
      expect(result.workspaceName).toBe('Dev Team');
      expect(result.role).toBe('viewer');
    });
  });

  describe('getWorkspaceInvitations', () => {
    it('should fetch and map invitations for a workspace', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:id/invitations`, () =>
          HttpResponse.json({
            data: [mockApiInvitation],
            meta: { total: 1 },
          })
        )
      );

      const result = await invitationApi.getWorkspaceInvitations('ws-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
      expect(result[0].workspaceId).toBe('ws-1');
      expect(result[0].email).toBe('invitee@example.com');
    });

    it('should return empty array for workspace with no invitations', async () => {
      server.use(
        http.get(`${API_URL}/workspaces/:id/invitations`, () =>
          HttpResponse.json({ data: [], meta: { total: 0 } })
        )
      );

      const result = await invitationApi.getWorkspaceInvitations('ws-empty');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPendingInvitations', () => {
    it('should fetch and map pending invitations for current user', async () => {
      server.use(
        http.get(`${API_URL}/invitations/pending`, () =>
          HttpResponse.json({
            data: [
              mockApiInvitation,
              { ...mockApiInvitation, id: 'inv-2', email: 'other@example.com' },
            ],
            meta: { total: 2 },
          })
        )
      );

      const result = await invitationApi.getPendingInvitations();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('inv-1');
      expect(result[1].id).toBe('inv-2');
    });
  });

  describe('revokeInvitation', () => {
    it('should send DELETE request for the invitation', async () => {
      let capturedUrl = '';
      server.use(
        http.delete(`${API_URL}/workspaces/:id/invitations/:invId`, ({ request }) => {
          capturedUrl = request.url;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await invitationApi.revokeInvitation('ws-1', 'inv-1');

      expect(capturedUrl).toContain('/workspaces/ws-1/invitations/inv-1');
    });
  });
});
