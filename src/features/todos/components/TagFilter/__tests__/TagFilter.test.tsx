/**
 * Tests for TagFilter Component
 *
 * Verifies that:
 * - Tags are fetched scoped to the active workspace
 * - "All Workspaces" mode fetches all tags (no workspace_id param)
 * - Tag toggle adds/removes from filter state
 * - Clear button resets filter
 * - Component hides when no tags exist
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { TagFilter } from '../TagFilter';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import { useWorkspaceUiStore } from '@features/workspaces/stores/workspaceUiStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

const workspaceATags = [
  {
    id: 'tag-a1',
    name: 'Frontend',
    color_hex: '#3b82f6',
    workspace_id: 'ws-a',
    usage_count: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-a2',
    name: 'Backend',
    color_hex: '#22c55e',
    workspace_id: 'ws-a',
    usage_count: 1,
    created_at: '2024-01-02T00:00:00Z',
  },
];

const workspaceBTags = [
  {
    id: 'tag-b1',
    name: 'Design',
    color_hex: '#ef4444',
    workspace_id: 'ws-b',
    usage_count: 2,
    created_at: '2024-01-03T00:00:00Z',
  },
];

const allTags = [...workspaceATags, ...workspaceBTags];

describe('TagFilter', () => {
  beforeEach(() => {
    // Reset stores
    useTodoUiStore.setState({
      selectedId: null,
      expandedIds: new Set(),
      showCompleted: true,
      sortBy: 'position',
      sortOrder: 'asc',
      searchQuery: '',
      filterTagIds: [],
      toolbarExpanded: false,
    });
    useWorkspaceUiStore.setState({
      activeWorkspaceId: null,
      _hasExplicitSelection: false,
      sidebarOpen: false,
    });
  });

  describe('Workspace-scoped tag fetching', () => {
    it('should fetch tags scoped to the active workspace', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_URL}/tags`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ data: workspaceATags });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-a',
        _hasExplicitSelection: true,
      });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      // Verify the API was called with workspace_id param
      const url = new URL(capturedUrl);
      expect(url.searchParams.get('workspace_id')).toBe('ws-a');
    });

    it('should only show tags from the active workspace', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: workspaceATags });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-a',
        _hasExplicitSelection: true,
      });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.queryByText('Design')).not.toBeInTheDocument();
    });

    it('should fetch all tags when in "All Workspaces" mode', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_URL}/tags`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ data: allTags });
        }),
      );

      // "All Workspaces" = null activeWorkspaceId + explicit selection
      useWorkspaceUiStore.setState({
        activeWorkspaceId: null,
        _hasExplicitSelection: true,
      });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();

      // No workspace_id param should be sent
      const url = new URL(capturedUrl);
      expect(url.searchParams.has('workspace_id')).toBe(false);
    });

    it('should fetch tags for workspace B when switched', async () => {
      server.use(
        http.get(`${API_URL}/tags`, ({ request }) => {
          const url = new URL(request.url);
          const wsId = url.searchParams.get('workspace_id');
          if (wsId === 'ws-b') {
            return HttpResponse.json({ data: workspaceBTags });
          }
          return HttpResponse.json({ data: [] });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-b',
        _hasExplicitSelection: true,
      });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument();
      });

      expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend')).not.toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render nothing when there are no tags', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: [] });
        }),
      );

      const { container } = render(<TagFilter />);

      // Wait for query to settle
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render tag badges for each tag', async () => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: workspaceATags });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-a',
        _hasExplicitSelection: true,
      });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
        expect(screen.getByText('Backend')).toBeInTheDocument();
      });
    });
  });

  describe('Tag toggle behavior', () => {
    beforeEach(() => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: workspaceATags });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-a',
        _hasExplicitSelection: true,
      });
    });

    it('should add tag to filter when clicked', async () => {
      const user = userEvent.setup();
      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Frontend'));

      const { filterTagIds } = useTodoUiStore.getState();
      expect(filterTagIds).toContain('tag-a1');
    });

    it('should remove tag from filter when clicked again', async () => {
      const user = userEvent.setup();
      useTodoUiStore.setState({ filterTagIds: ['tag-a1'] });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Frontend'));

      const { filterTagIds } = useTodoUiStore.getState();
      expect(filterTagIds).not.toContain('tag-a1');
    });

    it('should support multiple tags selected simultaneously', async () => {
      const user = userEvent.setup();
      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Frontend'));
      await user.click(screen.getByText('Backend'));

      const { filterTagIds } = useTodoUiStore.getState();
      expect(filterTagIds).toContain('tag-a1');
      expect(filterTagIds).toContain('tag-a2');
    });
  });

  describe('Clear filter', () => {
    beforeEach(() => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: workspaceATags });
        }),
      );

      useWorkspaceUiStore.setState({
        activeWorkspaceId: 'ws-a',
        _hasExplicitSelection: true,
      });
    });

    it('should show clear button when tags are selected', async () => {
      useTodoUiStore.setState({ filterTagIds: ['tag-a1'] });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      expect(screen.getByText(/clear/i)).toBeInTheDocument();
    });

    it('should not show clear button when no tags are selected', async () => {
      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();
    });

    it('should clear all selected tags when clear is clicked', async () => {
      const user = userEvent.setup();
      useTodoUiStore.setState({ filterTagIds: ['tag-a1', 'tag-a2'] });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText(/clear/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/clear/i));

      const { filterTagIds } = useTodoUiStore.getState();
      expect(filterTagIds).toEqual([]);
    });
  });
});
