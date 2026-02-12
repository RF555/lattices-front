/**
 * Tests for TodoToolbar Component
 *
 * Tests workspace filtering (THE BUG FIX), task count display, show completed toggle,
 * sort controls, search with debounce, and expand/collapse functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoToolbar } from '../TodoToolbar';
import type { Todo } from '@features/todos/types/todo';
import * as useTodosModule from '@features/todos/hooks/useTodos';
import * as todoUiStoreModule from '@features/todos/stores/todoUiStore';
import * as workspaceUiStoreModule from '@features/workspaces/stores/workspaceUiStore';

// Mock hooks and stores
vi.mock('@features/todos/hooks/useTodos');
vi.mock('@features/todos/stores/todoUiStore');
vi.mock('@features/workspaces/stores/workspaceUiStore');

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === 'toolbar.taskCount') return `${options?.count ?? 0} tasks`;
      if (key === 'toolbar.showCompleted') return 'Show completed';
      if (key === 'toolbar.sortManual') return 'Manual order';
      if (key === 'toolbar.sortDate') return 'Date created';
      if (key === 'toolbar.sortUpdated') return 'Date updated';
      if (key === 'toolbar.sortAlpha') return 'Alphabetical';
      if (key === 'toolbar.sortAscending') return 'Sort ascending';
      if (key === 'toolbar.sortDescending') return 'Sort descending';
      if (key === 'toolbar.searchPlaceholder') return 'Search tasks...';
      if (key === 'toolbar.expandAll') return 'Expand all';
      if (key === 'toolbar.collapseAll') return 'Collapse all';
      if (key === 'toolbar.showFilters') return 'Show filters';
      if (key === 'toolbar.hideFilters') return 'Hide filters';
      return key;
    },
  }),
}));

// Mock TagFilter component
vi.mock('../../TagFilter', () => ({
  TagFilter: () => <div data-testid="tag-filter">Tag Filter</div>,
}));

describe('TodoToolbar', () => {
  const createMockTodo = (id: string, title: string, overrides?: Partial<Todo>): Todo => ({
    id,
    title,
    description: null,
    isCompleted: false,
    parentId: null,
    workspaceId: 'workspace-1',
    position: 0,
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    childCount: 0,
    completedChildCount: 0,
    tags: [],
    children: [],
    ...overrides,
  });

  const mockUseTodoUiStore = {
    showCompleted: true,
    setShowCompleted: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    sortBy: 'position' as const,
    setSortBy: vi.fn(),
    sortOrder: 'asc' as const,
    setSortOrder: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    filterTagIds: [],
    toolbarExpanded: false,
    toggleToolbar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [] as Todo[],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue('workspace-1');

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(mockUseTodoUiStore);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Workspace Filtering (Bug Fix)', () => {
    it('should call useTodos with activeWorkspaceId when workspace is selected', () => {
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue('ws-123');

      render(<TodoToolbar />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'ws-123');
    });

    it('should call useTodos with undefined when activeWorkspaceId is null (All Workspaces mode)', () => {
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue(null);

      render(<TodoToolbar />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should call useTodos with different workspace IDs when workspace changes', () => {
      const { rerender } = render(<TodoToolbar />);

      // Initial workspace
      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'workspace-1');

      // Change workspace
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue('ws-999');
      rerender(<TodoToolbar />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'ws-999');
    });
  });

  describe('Task Count Display', () => {
    it('should display 0 tasks when todos is empty', () => {
      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: [] as Todo[],
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoToolbar />);

      // Desktop view
      expect(screen.getAllByText('0 tasks')[0]).toBeInTheDocument();
    });

    it('should display correct count for flat list', () => {
      const todos = [
        createMockTodo('1', 'Task 1'),
        createMockTodo('2', 'Task 2'),
        createMockTodo('3', 'Task 3'),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoToolbar />);

      expect(screen.getAllByText('3 tasks')[0]).toBeInTheDocument();
    });

    it('should count nested todos recursively', () => {
      const todos = [
        createMockTodo('1', 'Parent 1', {
          children: [
            createMockTodo('1-1', 'Child 1-1', { parentId: '1' }),
            createMockTodo('1-2', 'Child 1-2', {
              parentId: '1',
              children: [createMockTodo('1-2-1', 'Grandchild 1-2-1', { parentId: '1-2' })],
            }),
          ],
        }),
        createMockTodo('2', 'Parent 2'),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoToolbar />);

      // 2 parents + 2 children + 1 grandchild = 5 total
      expect(screen.getAllByText('5 tasks')[0]).toBeInTheDocument();
    });

    it('should display 0 when todos is undefined', () => {
      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoToolbar />);

      expect(screen.getAllByText('0 tasks')[0]).toBeInTheDocument();
    });
  });

  describe('Show Completed Toggle', () => {
    it('should render checkbox with correct initial state', () => {
      render(<TodoToolbar />);

      const checkbox = screen.getAllByRole('checkbox', { name: /show completed/i })[0];
      expect(checkbox).toBeChecked();
    });

    it('should call setShowCompleted when checkbox is toggled', async () => {
      const user = userEvent.setup();
      render(<TodoToolbar />);

      const checkbox = screen.getAllByRole('checkbox', { name: /show completed/i })[0];
      await user.click(checkbox);

      expect(mockUseTodoUiStore.setShowCompleted).toHaveBeenCalledWith(false);
    });

    it('should reflect unchecked state when showCompleted is false', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        showCompleted: false,
      });

      render(<TodoToolbar />);

      const checkbox = screen.getAllByRole('checkbox', { name: /show completed/i })[0];
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Sort Controls', () => {
    it('should render sort dropdown with correct options', () => {
      render(<TodoToolbar />);

      const sortSelect = screen.getAllByRole('combobox')[0];
      expect(sortSelect).toHaveValue('position');

      // Check all options exist
      expect(screen.getByText('Manual order')).toBeInTheDocument();
      expect(screen.getByText('Date created')).toBeInTheDocument();
      expect(screen.getByText('Date updated')).toBeInTheDocument();
      expect(screen.getByText('Alphabetical')).toBeInTheDocument();
    });

    it('should call setSortBy when sort option changes', async () => {
      const user = userEvent.setup();
      render(<TodoToolbar />);

      const sortSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(sortSelect, 'title');

      expect(mockUseTodoUiStore.setSortBy).toHaveBeenCalledWith('title');
    });

    it('should toggle sort order when sort order button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoToolbar />);

      const sortOrderButton = screen.getAllByTitle('Sort descending')[0];
      await user.click(sortOrderButton);

      expect(mockUseTodoUiStore.setSortOrder).toHaveBeenCalledWith('desc');
    });

    it('should show correct icon and title for ascending order', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        sortOrder: 'asc',
      });

      render(<TodoToolbar />);

      expect(screen.getAllByTitle('Sort descending')[0]).toBeInTheDocument();
    });

    it('should show correct icon and title for descending order', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        sortOrder: 'desc',
      });

      render(<TodoToolbar />);

      expect(screen.getAllByTitle('Sort ascending')[0]).toBeInTheDocument();
    });
  });

  describe('Search with Debounce', () => {
    it('should render search input', () => {
      render(<TodoToolbar />);

      const searchInput = screen.getAllByPlaceholderText('Search tasks...')[0];
      expect(searchInput).toBeInTheDocument();
    });

    it('should debounce search query updates (300ms)', async () => {
      vi.useFakeTimers();
      render(<TodoToolbar />);

      const searchInput = screen.getAllByPlaceholderText('Search tasks...')[0] as HTMLInputElement;

      // Use fireEvent for controlled input in fake timers context
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not call setSearchQuery immediately
      expect(mockUseTodoUiStore.setSearchQuery).not.toHaveBeenCalled();

      // Advance timers by 300ms
      await vi.advanceTimersByTimeAsync(300);

      // Should now have called setSearchQuery with final value
      expect(mockUseTodoUiStore.setSearchQuery).toHaveBeenCalledWith('test');

      vi.useRealTimers();
    });

    it('should cancel previous debounce when typing continues', async () => {
      vi.useFakeTimers();
      render(<TodoToolbar />);

      const searchInput = screen.getAllByPlaceholderText('Search tasks...')[0] as HTMLInputElement;
      const { fireEvent } = await import('@testing-library/react');

      // First change
      fireEvent.change(searchInput, { target: { value: 'tes' } });

      await vi.advanceTimersByTimeAsync(200);

      // Should not have been called yet
      expect(mockUseTodoUiStore.setSearchQuery).not.toHaveBeenCalled();

      // Second change (resets timer)
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await vi.advanceTimersByTimeAsync(200);

      // Still should not have been called (timer was reset)
      expect(mockUseTodoUiStore.setSearchQuery).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);

      // Now it should be called with final value
      expect(mockUseTodoUiStore.setSearchQuery).toHaveBeenCalledWith('test');

      vi.useRealTimers();
    });

    it('should sync local search state with store search query on mount', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        searchQuery: 'existing query',
      });

      render(<TodoToolbar />);

      const searchInput = screen.getAllByPlaceholderText('Search tasks...')[0];
      expect(searchInput).toHaveValue('existing query');
    });
  });

  describe('Expand/Collapse Buttons', () => {
    it('should call expandAll with all todo IDs when expand button is clicked', () => {
      const todos = [
        createMockTodo('1', 'Parent 1', {
          children: [
            createMockTodo('1-1', 'Child 1-1', { parentId: '1' }),
            createMockTodo('1-2', 'Child 1-2', { parentId: '1' }),
          ],
        }),
        createMockTodo('2', 'Parent 2'),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoToolbar />);

      const expandButtons = container.querySelectorAll('[title="Expand all"]');
      const expandButton = expandButtons[0] as HTMLElement;
      expandButton.click();

      // Should collect all IDs recursively
      expect(mockUseTodoUiStore.expandAll).toHaveBeenCalledWith(['1', '1-1', '1-2', '2']);
    });

    it('should call collapseAll when collapse button is clicked', () => {
      const { container } = render(<TodoToolbar />);

      const collapseButtons = container.querySelectorAll('[title="Collapse all"]');
      const collapseButton = collapseButtons[0] as HTMLElement;
      collapseButton.click();

      expect(mockUseTodoUiStore.collapseAll).toHaveBeenCalled();
    });

    it('should pass empty array to expandAll when todos is undefined', () => {
      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoToolbar />);

      const expandButtons = container.querySelectorAll('[title="Expand all"]');
      const expandButton = expandButtons[0] as HTMLElement;
      expandButton.click();

      expect(mockUseTodoUiStore.expandAll).toHaveBeenCalledWith([]);
    });

    it('should collect IDs from deeply nested todos', () => {
      const todos = [
        createMockTodo('1', 'Level 1', {
          children: [
            createMockTodo('1-1', 'Level 2', {
              parentId: '1',
              children: [
                createMockTodo('1-1-1', 'Level 3', {
                  parentId: '1-1',
                  children: [createMockTodo('1-1-1-1', 'Level 4', { parentId: '1-1-1' })],
                }),
              ],
            }),
          ],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoToolbar />);

      const expandButtons = container.querySelectorAll('[title="Expand all"]');
      const expandButton = expandButtons[0] as HTMLElement;
      expandButton.click();

      expect(mockUseTodoUiStore.expandAll).toHaveBeenCalledWith(['1', '1-1', '1-1-1', '1-1-1-1']);
    });
  });

  describe('TagFilter Component', () => {
    it('should render TagFilter component on desktop', () => {
      render(<TodoToolbar />);

      // TagFilter appears in desktop view (hidden on mobile)
      expect(screen.getAllByTestId('tag-filter')[0]).toBeInTheDocument();
    });
  });

  describe('Mobile Toolbar', () => {
    it('should toggle toolbar when mobile toggle button is clicked', () => {
      render(<TodoToolbar />);

      const toggleButton = screen.getByLabelText('Show filters');
      toggleButton.click();

      expect(mockUseTodoUiStore.toggleToolbar).toHaveBeenCalled();
    });

    it('should show active filter indicator when filters are active', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        searchQuery: 'test',
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      // Active filter indicator dot should be present
      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show indicator when toolbar is expanded', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        searchQuery: 'test',
        toolbarExpanded: true,
      });

      const { container } = render(<TodoToolbar />);

      // Indicator should not be present when expanded
      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should render expanded mobile panel when toolbarExpanded is true', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        toolbarExpanded: true,
      });

      render(<TodoToolbar />);

      // Mobile panel should have multiple search inputs (desktop + mobile)
      const searchInputs = screen.getAllByPlaceholderText('Search tasks...');
      expect(searchInputs.length).toBeGreaterThan(1);
    });

    it('should not render expanded panel when toolbarExpanded is false', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        toolbarExpanded: false,
      });

      render(<TodoToolbar />);

      // Only desktop search input should be present
      const searchInputs = screen.getAllByPlaceholderText('Search tasks...');
      expect(searchInputs.length).toBe(1);
    });
  });

  describe('Active Filters Detection', () => {
    it('should detect active filters when search query is present', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        searchQuery: 'test',
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should detect active filters when filterTagIds has items', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        filterTagIds: ['tag-1'],
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should detect active filters when showCompleted is false', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        showCompleted: false,
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should detect active filters when sortBy is not position', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        sortBy: 'title',
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show indicator when no filters are active', () => {
      vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
        ...mockUseTodoUiStore,
        searchQuery: '',
        filterTagIds: [],
        showCompleted: true,
        sortBy: 'position',
        toolbarExpanded: false,
      });

      const { container } = render(<TodoToolbar />);

      const indicator = container.querySelector('.bg-primary.rounded-full');
      expect(indicator).not.toBeInTheDocument();
    });
  });
});
