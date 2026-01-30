/**
 * Tests for Todo UI Store
 *
 * Tests Zustand store for UI state management (expanded nodes, filters, sorting).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTodoUiStore } from './todoUiStore';

describe('todoUiStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useTodoUiStore.setState({
      expandedIds: new Set(),
      selectedId: null,
      showCompleted: true,
      sortBy: 'position',
      sortOrder: 'asc',
      searchQuery: '',
      filterTagIds: [],
    });
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTodoUiStore.getState();
      expect(state.expandedIds).toEqual(new Set());
      expect(state.selectedId).toBeNull();
      expect(state.showCompleted).toBe(true);
      expect(state.sortBy).toBe('position');
      expect(state.sortOrder).toBe('asc');
      expect(state.searchQuery).toBe('');
      expect(state.filterTagIds).toEqual([]);
    });
  });

  describe('toggleExpanded', () => {
    it('should expand a collapsed node', () => {
      const store = useTodoUiStore.getState();
      store.toggleExpanded('todo-1');

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(true);
    });

    it('should collapse an expanded node', () => {
      // First expand
      useTodoUiStore.setState({ expandedIds: new Set(['todo-1']) });

      // Then toggle to collapse
      const store = useTodoUiStore.getState();
      store.toggleExpanded('todo-1');

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(false);
    });

    it('should toggle multiple nodes independently', () => {
      const store = useTodoUiStore.getState();
      store.toggleExpanded('todo-1');
      store.toggleExpanded('todo-2');
      store.toggleExpanded('todo-3');

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(true);
      expect(state.expandedIds.has('todo-2')).toBe(true);
      expect(state.expandedIds.has('todo-3')).toBe(true);

      // Toggle one off
      store.toggleExpanded('todo-2');
      expect(useTodoUiStore.getState().expandedIds.has('todo-2')).toBe(false);
      expect(useTodoUiStore.getState().expandedIds.has('todo-1')).toBe(true);
      expect(useTodoUiStore.getState().expandedIds.has('todo-3')).toBe(true);
    });
  });

  describe('expandAll', () => {
    it('should expand all provided IDs', () => {
      const store = useTodoUiStore.getState();
      store.expandAll(['todo-1', 'todo-2', 'todo-3']);

      const state = useTodoUiStore.getState();
      expect(state.expandedIds).toEqual(new Set(['todo-1', 'todo-2', 'todo-3']));
    });

    it('should replace existing expanded IDs', () => {
      useTodoUiStore.setState({ expandedIds: new Set(['old-1', 'old-2']) });

      const store = useTodoUiStore.getState();
      store.expandAll(['new-1', 'new-2']);

      const state = useTodoUiStore.getState();
      expect(state.expandedIds).toEqual(new Set(['new-1', 'new-2']));
      expect(state.expandedIds.has('old-1')).toBe(false);
    });
  });

  describe('collapseAll', () => {
    it('should collapse all nodes', () => {
      useTodoUiStore.setState({ expandedIds: new Set(['todo-1', 'todo-2', 'todo-3']) });

      const store = useTodoUiStore.getState();
      store.collapseAll();

      const state = useTodoUiStore.getState();
      expect(state.expandedIds).toEqual(new Set());
    });
  });

  describe('setExpanded', () => {
    it('should expand a node when expanded is true', () => {
      const store = useTodoUiStore.getState();
      store.setExpanded('todo-1', true);

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(true);
    });

    it('should collapse a node when expanded is false', () => {
      useTodoUiStore.setState({ expandedIds: new Set(['todo-1']) });

      const store = useTodoUiStore.getState();
      store.setExpanded('todo-1', false);

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(false);
    });

    it('should not affect other expanded nodes', () => {
      useTodoUiStore.setState({ expandedIds: new Set(['todo-1', 'todo-2']) });

      const store = useTodoUiStore.getState();
      store.setExpanded('todo-2', false);

      const state = useTodoUiStore.getState();
      expect(state.expandedIds.has('todo-1')).toBe(true);
      expect(state.expandedIds.has('todo-2')).toBe(false);
    });
  });

  describe('setSelectedId', () => {
    it('should set selected ID', () => {
      const store = useTodoUiStore.getState();
      store.setSelectedId('todo-1');

      expect(useTodoUiStore.getState().selectedId).toBe('todo-1');
    });

    it('should clear selected ID when set to null', () => {
      useTodoUiStore.setState({ selectedId: 'todo-1' });

      const store = useTodoUiStore.getState();
      store.setSelectedId(null);

      expect(useTodoUiStore.getState().selectedId).toBeNull();
    });
  });

  describe('setShowCompleted', () => {
    it('should toggle show completed', () => {
      const store = useTodoUiStore.getState();
      store.setShowCompleted(false);

      expect(useTodoUiStore.getState().showCompleted).toBe(false);

      store.setShowCompleted(true);
      expect(useTodoUiStore.getState().showCompleted).toBe(true);
    });
  });

  describe('Sorting', () => {
    it('should set sort by', () => {
      const store = useTodoUiStore.getState();
      store.setSortBy('createdAt');

      expect(useTodoUiStore.getState().sortBy).toBe('createdAt');
    });

    it('should set sort order', () => {
      const store = useTodoUiStore.getState();
      store.setSortOrder('desc');

      expect(useTodoUiStore.getState().sortOrder).toBe('desc');
    });
  });

  describe('Filtering', () => {
    it('should set search query', () => {
      const store = useTodoUiStore.getState();
      store.setSearchQuery('test query');

      expect(useTodoUiStore.getState().searchQuery).toBe('test query');
    });

    it('should set filter tag IDs', () => {
      const store = useTodoUiStore.getState();
      store.setFilterTagIds(['tag-1', 'tag-2']);

      expect(useTodoUiStore.getState().filterTagIds).toEqual(['tag-1', 'tag-2']);
    });

    it('should clear all filters', () => {
      useTodoUiStore.setState({
        searchQuery: 'test',
        filterTagIds: ['tag-1'],
      });

      const store = useTodoUiStore.getState();
      store.clearFilters();

      const state = useTodoUiStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.filterTagIds).toEqual([]);
    });

    it('should not clear non-filter state when clearing filters', () => {
      useTodoUiStore.setState({
        expandedIds: new Set(['todo-1']),
        selectedId: 'todo-2',
        searchQuery: 'test',
      });

      const store = useTodoUiStore.getState();
      store.clearFilters();

      const state = useTodoUiStore.getState();
      expect(state.expandedIds).toEqual(new Set(['todo-1']));
      expect(state.selectedId).toBe('todo-2');
    });
  });

  describe('Selector Behavior', () => {
    it('should allow selecting expanded IDs from state', () => {
      useTodoUiStore.setState({ expandedIds: new Set(['todo-1', 'todo-2']) });
      const expandedIds = useTodoUiStore.getState().expandedIds;
      expect(expandedIds).toEqual(new Set(['todo-1', 'todo-2']));
    });

    it('should allow selecting selected ID from state', () => {
      useTodoUiStore.setState({ selectedId: 'todo-1' });
      const selectedId = useTodoUiStore.getState().selectedId;
      expect(selectedId).toBe('todo-1');
    });

    it('should allow selecting show completed state', () => {
      useTodoUiStore.setState({ showCompleted: false });
      const showCompleted = useTodoUiStore.getState().showCompleted;
      expect(showCompleted).toBe(false);
    });

    it('should allow selecting all filter values', () => {
      useTodoUiStore.setState({
        searchQuery: 'test',
        filterTagIds: ['tag-1'],
      });

      const state = useTodoUiStore.getState();
      expect({
        searchQuery: state.searchQuery,
        filterTagIds: state.filterTagIds,
      }).toEqual({
        searchQuery: 'test',
        filterTagIds: ['tag-1'],
      });
    });
  });
});
