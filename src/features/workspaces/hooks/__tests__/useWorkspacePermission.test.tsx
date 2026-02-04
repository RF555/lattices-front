/**
 * Tests for useWorkspacePermission Hook
 *
 * Tests permission calculation based on workspace role.
 * Uses renderHook from @testing-library/react with QueryClient wrapper.
 * Mocks useAuthStore and useWorkspaceMembers via QueryClient.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWorkspacePermission } from '../useWorkspacePermission';
import { useAuthStore } from '@features/auth/stores/authStore';
import { queryKeys } from '@lib/api/queryKeys';
import type { WorkspaceMember } from '../../types/workspace';
import type { User } from '@lib/auth/types';

// Mock the useWorkspaceMembers hook by providing data via QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
      },
    },
  });
};

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2026-01-01T00:00:00Z',
};

const createMockMember = (userId: string, role: 'owner' | 'admin' | 'member' | 'viewer'): WorkspaceMember => ({
  userId,
  email: 'user@example.com',
  displayName: 'User Name',
  avatarUrl: null,
  role,
  joinedAt: '2026-01-01T00:00:00Z',
});

describe('useWorkspacePermission', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      isInitialized: true,
      error: null,
    });

    // Create fresh QueryClient for each test
    queryClient = createTestQueryClient();

    vi.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  describe('Initial State', () => {
    it('should return minimum permissions when no user is authenticated', () => {
      useAuthStore.setState({ user: null });

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });

    it('should return minimum permissions when no workspaceId is provided', () => {
      useAuthStore.setState({ user: mockUser });

      const { result } = renderHook(() => useWorkspacePermission(undefined), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });

    it('should return minimum permissions when members data is not loaded', () => {
      useAuthStore.setState({ user: mockUser });

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });

    it('should return minimum permissions when user is not a member', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [
        createMockMember('other-user-1', 'admin'),
        createMockMember('other-user-2', 'member'),
      ];

      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBeNull();
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });
  });

  describe('Owner Role Permissions', () => {
    it('should return full permissions for owner role', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [
        createMockMember('user-1', 'owner'),
        createMockMember('user-2', 'admin'),
      ];

      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('owner');
      });

      expect(result.current).toEqual({
        role: 'owner',
        canEdit: true,
        canManageMembers: true,
        canDelete: true,
        isOwner: true,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });
  });

  describe('Admin Role Permissions', () => {
    it('should return correct permissions for admin role', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [
        createMockMember('owner-user', 'owner'),
        createMockMember('user-1', 'admin'),
      ];

      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('admin');
      });

      expect(result.current).toEqual({
        role: 'admin',
        canEdit: true,
        canManageMembers: true,
        canDelete: false,
        isOwner: false,
        isAdmin: true,
        isMember: false,
        isViewer: false,
      });
    });
  });

  describe('Member Role Permissions', () => {
    it('should return correct permissions for member role', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [
        createMockMember('owner-user', 'owner'),
        createMockMember('user-1', 'member'),
      ];

      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('member');
      });

      expect(result.current).toEqual({
        role: 'member',
        canEdit: true,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: true,
        isViewer: false,
      });
    });
  });

  describe('Viewer Role Permissions', () => {
    it('should return minimal permissions for viewer role', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [
        createMockMember('owner-user', 'owner'),
        createMockMember('user-1', 'viewer'),
      ];

      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('viewer');
      });

      expect(result.current).toEqual({
        role: 'viewer',
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: true,
      });
    });
  });

  describe('Permission Flags Validation', () => {
    it('should correctly calculate canEdit for all roles', async () => {
      useAuthStore.setState({ user: mockUser });

      // Test each role
      const roles: Array<{ role: 'owner' | 'admin' | 'member' | 'viewer'; canEdit: boolean }> = [
        { role: 'owner', canEdit: true },
        { role: 'admin', canEdit: true },
        { role: 'member', canEdit: true },
        { role: 'viewer', canEdit: false },
      ];

      for (const { role, canEdit } of roles) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canEdit).toBe(canEdit);
        });
      }
    });

    it('should correctly calculate canManageMembers for all roles', async () => {
      useAuthStore.setState({ user: mockUser });

      const roles: Array<{ role: 'owner' | 'admin' | 'member' | 'viewer'; canManageMembers: boolean }> = [
        { role: 'owner', canManageMembers: true },
        { role: 'admin', canManageMembers: true },
        { role: 'member', canManageMembers: false },
        { role: 'viewer', canManageMembers: false },
      ];

      for (const { role, canManageMembers } of roles) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canManageMembers).toBe(canManageMembers);
        });
      }
    });

    it('should correctly calculate canDelete for all roles', async () => {
      useAuthStore.setState({ user: mockUser });

      const roles: Array<{ role: 'owner' | 'admin' | 'member' | 'viewer'; canDelete: boolean }> = [
        { role: 'owner', canDelete: true },
        { role: 'admin', canDelete: false },
        { role: 'member', canDelete: false },
        { role: 'viewer', canDelete: false },
      ];

      for (const { role, canDelete } of roles) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canDelete).toBe(canDelete);
        });
      }
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy for editing permissions', async () => {
      useAuthStore.setState({ user: mockUser });

      const rolesWithEdit = ['owner', 'admin', 'member'] as const;
      const rolesWithoutEdit = ['viewer'] as const;

      for (const role of rolesWithEdit) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canEdit).toBe(true);
        });
      }

      for (const role of rolesWithoutEdit) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canEdit).toBe(false);
        });
      }
    });

    it('should respect role hierarchy for member management permissions', async () => {
      useAuthStore.setState({ user: mockUser });

      const rolesWithManagement = ['owner', 'admin'] as const;
      const rolesWithoutManagement = ['member', 'viewer'] as const;

      for (const role of rolesWithManagement) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canManageMembers).toBe(true);
        });
      }

      for (const role of rolesWithoutManagement) {
        const members: WorkspaceMember[] = [createMockMember('user-1', role)];
        queryClient.setQueryData(queryKeys.workspaces.members(`workspace-${role}`), members);

        const { result } = renderHook(() => useWorkspacePermission(`workspace-${role}`), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
          expect(result.current.canManageMembers).toBe(false);
        });
      }
    });
  });

  describe('Memoization', () => {
    it('should memoize result when dependencies do not change', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [createMockMember('user-1', 'admin')];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result, rerender } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('admin');
      });

      const firstResult = result.current;

      // Rerender without changing dependencies
      rerender();

      // Should return same object reference due to useMemo
      expect(result.current).toBe(firstResult);
    });

    it('should recalculate when user changes', async () => {
      const user1: User = { ...mockUser, id: 'user-1' };
      const user2: User = { ...mockUser, id: 'user-2' };

      useAuthStore.setState({ user: user1 });

      const members: WorkspaceMember[] = [
        createMockMember('user-1', 'admin'),
        createMockMember('user-2', 'viewer'),
      ];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result, rerender } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('admin');
      });

      // Change user
      useAuthStore.setState({ user: user2 });
      rerender();

      await waitFor(() => {
        expect(result.current.role).toBe('viewer');
      });

      expect(result.current.isViewer).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should recalculate when members data changes', async () => {
      useAuthStore.setState({ user: mockUser });

      const members1: WorkspaceMember[] = [createMockMember('user-1', 'member')];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members1);

      const { result, rerender } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('member');
      });

      // Update member role
      const members2: WorkspaceMember[] = [createMockMember('user-1', 'admin')];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members2);
      rerender();

      await waitFor(() => {
        expect(result.current.role).toBe('admin');
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canManageMembers).toBe(true);
    });

    it('should return different permissions for different workspaces', async () => {
      useAuthStore.setState({ user: mockUser });

      const workspace1Members: WorkspaceMember[] = [createMockMember('user-1', 'admin')];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), workspace1Members);

      const { result: result1 } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result1.current.role).toBe('admin');
      });

      expect(result1.current.isAdmin).toBe(true);
      expect(result1.current.canManageMembers).toBe(true);

      // Test with different workspace
      const workspace2Members: WorkspaceMember[] = [createMockMember('user-1', 'viewer')];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-2'), workspace2Members);

      const { result: result2 } = renderHook(() => useWorkspacePermission('workspace-2'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result2.current.role).toBe('viewer');
      });

      expect(result2.current.isViewer).toBe(true);
      expect(result2.current.canEdit).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty members array', async () => {
      useAuthStore.setState({ user: mockUser });

      const members: WorkspaceMember[] = [];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBeNull();
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });

    it('should handle multiple members with same userId', async () => {
      useAuthStore.setState({ user: mockUser });

      // Edge case: duplicate user entries (should use first match)
      const members: WorkspaceMember[] = [
        createMockMember('user-1', 'viewer'),
        createMockMember('user-1', 'admin'),
      ];
      queryClient.setQueryData(queryKeys.workspaces.members('workspace-1'), members);

      const { result } = renderHook(() => useWorkspacePermission('workspace-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.role).toBe('viewer');
      });
    });

    it('should handle empty workspaceId string', () => {
      useAuthStore.setState({ user: mockUser });

      const { result } = renderHook(() => useWorkspacePermission(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toEqual({
        role: null,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      });
    });
  });
});
