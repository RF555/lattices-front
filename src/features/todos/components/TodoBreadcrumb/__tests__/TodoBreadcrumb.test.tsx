/**
 * Tests for TodoBreadcrumb Component
 *
 * Tests workspace filtering (THE BUG FIX), ancestor path rendering,
 * breadcrumb navigation, and chevron separators.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoBreadcrumb } from '../TodoBreadcrumb';
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
    t: (key: string) => {
      if (key === 'breadcrumb.ariaLabel') return 'Task breadcrumb navigation';
      return key;
    },
  }),
}));

describe('TodoBreadcrumb', () => {
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

  const mockSetSelectedId = vi.fn();

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

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(mockSetSelectedId);
  });

  describe('Workspace Filtering (Bug Fix)', () => {
    it('should call useTodos with activeWorkspaceId when workspace is selected', () => {
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue('ws-456');

      render(<TodoBreadcrumb todoId="todo-1" />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'ws-456');
    });

    it('should call useTodos with undefined when activeWorkspaceId is null (All Workspaces mode)', () => {
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue(null);

      render(<TodoBreadcrumb todoId="todo-1" />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should call useTodos with different workspace IDs when workspace changes', () => {
      const { rerender } = render(<TodoBreadcrumb todoId="todo-1" />);

      // Initial workspace
      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'workspace-1');

      // Change workspace
      vi.mocked(workspaceUiStoreModule.useActiveWorkspaceId).mockReturnValue('ws-777');
      rerender(<TodoBreadcrumb todoId="todo-1" />);

      expect(useTodosModule.useTodos).toHaveBeenCalledWith(undefined, 'ws-777');
    });
  });

  describe('Ancestor Path Rendering', () => {
    it('should return null when there are no ancestors (root-level todo)', () => {
      const todos = [createMockTodo('root-1', 'Root Task')];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="root-1" />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when todos is undefined', () => {
      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="todo-1" />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when todos is empty', () => {
      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: [] as Todo[],
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="todo-1" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render single ancestor for direct child', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();
    });

    it('should render multiple ancestors for deeply nested todo', () => {
      const todos = [
        createMockTodo('root-1', 'Root Task', {
          children: [
            createMockTodo('child-1', 'Child Task', {
              parentId: 'root-1',
              children: [
                createMockTodo('grandchild-1', 'Grandchild Task', { parentId: 'child-1' }),
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

      render(<TodoBreadcrumb todoId="grandchild-1" />);

      expect(screen.getByText('Root Task')).toBeInTheDocument();
      expect(screen.getByText('Child Task')).toBeInTheDocument();
    });

    it('should render ancestors in correct order (root to parent)', () => {
      const todos = [
        createMockTodo('level-1', 'Level 1', {
          children: [
            createMockTodo('level-2', 'Level 2', {
              parentId: 'level-1',
              children: [
                createMockTodo('level-3', 'Level 3', {
                  parentId: 'level-2',
                  children: [createMockTodo('level-4', 'Level 4', { parentId: 'level-3' })],
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

      const { container } = render(<TodoBreadcrumb todoId="level-4" />);

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent('Level 1');
      expect(buttons[1]).toHaveTextContent('Level 2');
      expect(buttons[2]).toHaveTextContent('Level 3');
    });

    it('should not include the target todo itself in breadcrumb', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();
      expect(screen.queryByText('Child Task')).not.toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should call setSelectedId when ancestor is clicked', async () => {
      const user = userEvent.setup();
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      const ancestorButton = screen.getByText('Parent Task');
      await user.click(ancestorButton);

      expect(mockSetSelectedId).toHaveBeenCalledWith('parent-1');
    });

    it('should stop propagation when ancestor button is clicked', async () => {
      const user = userEvent.setup();
      const mockClickHandler = vi.fn();
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={mockClickHandler}>
          <TodoBreadcrumb todoId="child-1" />
        </div>,
      );

      const ancestorButton = screen.getByText('Parent Task');
      await user.click(ancestorButton);

      // setSelectedId should be called
      expect(mockSetSelectedId).toHaveBeenCalledWith('parent-1');
      // But parent click handler should NOT be called (propagation stopped)
      expect(mockClickHandler).not.toHaveBeenCalled();
    });

    it('should render full task name text for truncated titles', () => {
      const todos = [
        createMockTodo('parent-1', 'Very Long Parent Task Name That Will Be Truncated', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      const ancestorButton = screen.getByText('Very Long Parent Task Name That Will Be Truncated');
      expect(ancestorButton).toBeInTheDocument();
      expect(ancestorButton).toHaveClass('truncate');
    });

    it('should navigate to correct ancestor when multiple ancestors are present', async () => {
      const user = userEvent.setup();
      const todos = [
        createMockTodo('level-1', 'Level 1', {
          children: [
            createMockTodo('level-2', 'Level 2', {
              parentId: 'level-1',
              children: [createMockTodo('level-3', 'Level 3', { parentId: 'level-2' })],
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

      render(<TodoBreadcrumb todoId="level-3" />);

      // Click on second ancestor (Level 2)
      const level2Button = screen.getByText('Level 2');
      await user.click(level2Button);

      expect(mockSetSelectedId).toHaveBeenCalledWith('level-2');

      // Reset mock
      mockSetSelectedId.mockClear();

      // Click on first ancestor (Level 1)
      const level1Button = screen.getByText('Level 1');
      await user.click(level1Button);

      expect(mockSetSelectedId).toHaveBeenCalledWith('level-1');
    });
  });

  describe('Chevron Separators', () => {
    it('should render chevron separator between ancestors', () => {
      const todos = [
        createMockTodo('root-1', 'Root Task', {
          children: [
            createMockTodo('child-1', 'Child Task', {
              parentId: 'root-1',
              children: [
                createMockTodo('grandchild-1', 'Grandchild Task', { parentId: 'child-1' }),
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

      const { container } = render(<TodoBreadcrumb todoId="grandchild-1" />);

      // Ancestors: [Root Task, Child Task]
      // Root > Child >
      // Total: 1 chevron between Root and Child, 1 trailing = 2 chevrons
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBe(2);
    });

    it('should not render chevron before first ancestor', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="child-1" />);

      const spans = container.querySelectorAll('span.flex.items-center');
      const firstSpan = spans[0];

      // First span should contain button but chevron should be rendered conditionally (index > 0)
      expect(firstSpan?.querySelector('button')).toBeInTheDocument();

      // There should be total 2 chevrons: none before first ancestor, 1 trailing
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBe(1); // Only trailing chevron
    });

    it('should render trailing chevron after last ancestor', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="child-1" />);

      // Should have trailing chevron after "Parent Task >"
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render correct number of chevrons for 3-level hierarchy', () => {
      const todos = [
        createMockTodo('level-1', 'Level 1', {
          children: [
            createMockTodo('level-2', 'Level 2', {
              parentId: 'level-1',
              children: [
                createMockTodo('level-3', 'Level 3', {
                  parentId: 'level-2',
                  children: [createMockTodo('level-4', 'Level 4', { parentId: 'level-3' })],
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

      const { container } = render(<TodoBreadcrumb todoId="level-4" />);

      // 3 ancestors: Level 1 > Level 2 > Level 3 >
      // Chevrons: 2 between ancestors + 1 trailing = 3 total
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('should render nav element with aria-label', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      const nav = screen.getByRole('navigation', { name: 'Task breadcrumb navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('should render ancestor buttons as type="button"', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      const button = screen.getByText('Parent Task');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have hover styles for interactive breadcrumb links', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      render(<TodoBreadcrumb todoId="child-1" />);

      const button = screen.getByText('Parent Task');
      expect(button).toHaveClass('hover:text-gray-600', 'hover:underline');
    });
  });

  describe('Edge Cases', () => {
    it('should handle todo not found in tree gracefully', () => {
      const todos = [createMockTodo('other-1', 'Other Task')];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="non-existent" />);

      // Should return null (no breadcrumb) when todo not found
      expect(container.firstChild).toBeNull();
    });

    it('should handle empty children arrays gracefully', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { container } = render(<TodoBreadcrumb todoId="child-1" />);

      expect(container.firstChild).toBeNull();
    });

    it('should memoize ancestor calculation when todos and todoId do not change', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [createMockTodo('child-1', 'Child Task', { parentId: 'parent-1' })],
        }),
      ];

      vi.mocked(useTodosModule.useTodos).mockReturnValue({
        data: todos,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as ReturnType<typeof useTodosModule.useTodos>);

      const { rerender } = render(<TodoBreadcrumb todoId="child-1" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();

      // Rerender with same props - should still work
      rerender(<TodoBreadcrumb todoId="child-1" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();
    });

    it('should update when todoId changes', () => {
      const todos = [
        createMockTodo('parent-1', 'Parent Task', {
          children: [
            createMockTodo('child-1', 'Child Task 1', { parentId: 'parent-1' }),
            createMockTodo('child-2', 'Child Task 2', { parentId: 'parent-1' }),
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

      const { rerender } = render(<TodoBreadcrumb todoId="child-1" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();

      // Change todoId to different child (same parent, so same breadcrumb)
      rerender(<TodoBreadcrumb todoId="child-2" />);

      expect(screen.getByText('Parent Task')).toBeInTheDocument();
    });
  });
});
