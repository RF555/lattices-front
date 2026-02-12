/**
 * Tests for TagFilter Component
 *
 * Verifies that:
 * - Tags are fetched scoped to the active workspace
 * - "All Workspaces" mode fetches all tags (no workspace_id param)
 * - "All Workspaces" mode merges tags with the same name
 * - Tag toggle adds/removes from filter state
 * - Merged tag toggle adds/removes all underlying IDs
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

/** Tags with duplicate names across workspaces (for merge tests) */
const allTagsWithDuplicates = [
  ...workspaceATags,
  {
    id: 'tag-b1',
    name: 'Frontend', // same name as tag-a1
    color_hex: '#ef4444',
    workspace_id: 'ws-b',
    usage_count: 1,
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 'tag-b2',
    name: 'Design',
    color_hex: '#8b5cf6',
    workspace_id: 'ws-b',
    usage_count: 2,
    created_at: '2024-01-04T00:00:00Z',
  },
];

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

  describe('Merged tags in All Workspaces mode', () => {
    beforeEach(() => {
      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: allTagsWithDuplicates });
        }),
      );

      // Set to "All Workspaces" mode
      useWorkspaceUiStore.setState({
        activeWorkspaceId: null,
        _hasExplicitSelection: true,
      });
    });

    it('should render one button per unique tag name', async () => {
      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      // "Frontend" appears in both workspaces but should render once
      const frontendButtons = screen.getAllByText('Frontend');
      expect(frontendButtons).toHaveLength(1);

      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('should add all underlying IDs when a merged tag is toggled on', async () => {
      const user = userEvent.setup();
      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Frontend'));

      const { filterTagIds } = useTodoUiStore.getState();
      // Both tag-a1 and tag-b1 share the name "Frontend"
      expect(filterTagIds).toContain('tag-a1');
      expect(filterTagIds).toContain('tag-b1');
    });

    it('should remove all underlying IDs when a merged tag is toggled off', async () => {
      const user = userEvent.setup();
      useTodoUiStore.setState({ filterTagIds: ['tag-a1', 'tag-b1'] });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Frontend'));

      const { filterTagIds } = useTodoUiStore.getState();
      expect(filterTagIds).not.toContain('tag-a1');
      expect(filterTagIds).not.toContain('tag-b1');
    });

    it('should show merged tag as active if any underlying ID is in filter', async () => {
      // Only one of the two "Frontend" IDs is selected
      useTodoUiStore.setState({ filterTagIds: ['tag-a1'] });

      render(<TagFilter />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
      });

      // The button should be fully opaque (active) since tag-a1 is in filter
      const frontendButton = screen.getByText('Frontend').closest('button')!;
      expect(frontendButton.className).not.toContain('opacity-50');
    });

    it('should not merge tags in single workspace mode', async () => {
      // Override to single workspace with duplicate names
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

      // In single workspace mode, tags are rendered individually (keyed by id)
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });
  });
});
