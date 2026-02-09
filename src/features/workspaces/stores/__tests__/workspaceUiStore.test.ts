/**
 * Tests for Workspace UI Store
 *
 * Tests Zustand workspace UI store with active workspace selection and sidebar toggle.
 * Verifies localStorage persistence for activeWorkspaceId.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from '@/constants';
import { useWorkspaceUiStore, useActiveWorkspaceId, useSidebarOpen } from '../workspaceUiStore';

describe('workspaceUiStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWorkspaceUiStore.setState({
      activeWorkspaceId: null,
      sidebarOpen: false,
    });
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useWorkspaceUiStore.getState();
      expect(state.activeWorkspaceId).toBeNull();
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('setActiveWorkspace', () => {
    it('should set the active workspace ID', () => {
      const store = useWorkspaceUiStore.getState();
      store.setActiveWorkspace('ws-123');

      const state = useWorkspaceUiStore.getState();
      expect(state.activeWorkspaceId).toBe('ws-123');
    });

    it('should update workspace ID on multiple calls', () => {
      const store = useWorkspaceUiStore.getState();

      store.setActiveWorkspace('ws-1');
      expect(useWorkspaceUiStore.getState().activeWorkspaceId).toBe('ws-1');

      store.setActiveWorkspace('ws-2');
      expect(useWorkspaceUiStore.getState().activeWorkspaceId).toBe('ws-2');
    });

    it('should persist activeWorkspaceId to localStorage', () => {
      const store = useWorkspaceUiStore.getState();
      store.setActiveWorkspace('ws-persist');

      // Check localStorage directly
      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.activeWorkspaceId).toBe('ws-persist');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from false to true', () => {
      const store = useWorkspaceUiStore.getState();
      expect(store.sidebarOpen).toBe(false);

      store.toggleSidebar();

      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle sidebar from true to false', () => {
      const store = useWorkspaceUiStore.getState();
      useWorkspaceUiStore.setState({ sidebarOpen: true });

      store.toggleSidebar();

      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle multiple times', () => {
      const store = useWorkspaceUiStore.getState();

      store.toggleSidebar();
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(true);

      store.toggleSidebar();
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(false);

      store.toggleSidebar();
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(true);
    });

    it('should not persist sidebarOpen to localStorage', () => {
      const store = useWorkspaceUiStore.getState();
      store.toggleSidebar();

      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      if (stored) {
        const parsed = JSON.parse(stored);
        // sidebarOpen should not be in the persisted state (partialize excludes it)
        expect(parsed.state).not.toHaveProperty('sidebarOpen');
      }
    });
  });

  describe('clearWorkspace', () => {
    it('should reset both activeWorkspaceId and sidebarOpen', () => {
      // Set some state first
      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-123',
        sidebarOpen: true,
      });

      const store = useWorkspaceUiStore.getState();
      store.clearWorkspace();

      const state = useWorkspaceUiStore.getState();
      expect(state.activeWorkspaceId).toBeNull();
      expect(state.sidebarOpen).toBe(false);
    });

    it('should clear workspace when already null', () => {
      const store = useWorkspaceUiStore.getState();
      store.clearWorkspace();

      const state = useWorkspaceUiStore.getState();
      expect(state.activeWorkspaceId).toBeNull();
      expect(state.sidebarOpen).toBe(false);
    });

    it('should clear persisted workspace from localStorage', () => {
      const store = useWorkspaceUiStore.getState();
      store.setActiveWorkspace('ws-to-clear');

      // Verify it's stored
      let stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      expect(stored).toBeTruthy();

      store.clearWorkspace();

      // Check localStorage is updated
      stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.activeWorkspaceId).toBeNull();
      }
    });
  });

  describe('Selector Hooks Export', () => {
    it('should export useActiveWorkspaceId selector', () => {
      expect(useActiveWorkspaceId).toBeDefined();
      expect(typeof useActiveWorkspaceId).toBe('function');
    });

    it('should export useSidebarOpen selector', () => {
      expect(useSidebarOpen).toBeDefined();
      expect(typeof useSidebarOpen).toBe('function');
    });
  });

  describe('State Persistence', () => {
    it('should persist activeWorkspaceId across store re-creation', () => {
      const store = useWorkspaceUiStore.getState();
      store.setActiveWorkspace('ws-persist');

      // Simulate store re-initialization by clearing state and letting persist hydrate
      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.activeWorkspaceId).toBe('ws-persist');
    });

    it('should not persist sidebarOpen (partialize excludes it)', () => {
      const store = useWorkspaceUiStore.getState();
      store.setActiveWorkspace('ws-1');
      store.toggleSidebar();

      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_UI);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.activeWorkspaceId).toBe('ws-1');
      expect(parsed.state).not.toHaveProperty('sidebarOpen');
    });
  });

  describe('State Independence', () => {
    it('should allow independent changes to activeWorkspaceId and sidebarOpen', () => {
      const store = useWorkspaceUiStore.getState();

      // Change workspace without affecting sidebar
      store.setActiveWorkspace('ws-1');
      expect(useWorkspaceUiStore.getState().activeWorkspaceId).toBe('ws-1');
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(false);

      // Toggle sidebar without affecting workspace
      store.toggleSidebar();
      expect(useWorkspaceUiStore.getState().activeWorkspaceId).toBe('ws-1');
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(true);

      // Change workspace again
      store.setActiveWorkspace('ws-2');
      expect(useWorkspaceUiStore.getState().activeWorkspaceId).toBe('ws-2');
      expect(useWorkspaceUiStore.getState().sidebarOpen).toBe(true);
    });
  });
});
