import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SortableTodoNode } from '../SortableTodoNode';
import type { Todo } from '../../../types/todo';
import * as useIsMobileModule from '@hooks/useIsMobile';

// Mock useIsMobile
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn().mockReturnValue({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
    isOver: false,
  }),
}));

// Mock TodoNodeContent
vi.mock('../../TodoNodeContent', () => ({
  TodoNodeContent: ({ todo, leadingSlot }: { todo: Todo; leadingSlot?: React.ReactNode }) => (
    <div data-testid={`todo-node-content-${todo.id}`}>
      {leadingSlot}
      <span>{todo.title}</span>
    </div>
  ),
}));

describe('SortableTodoNode', () => {
  const createMockTodo = (id: string, title: string): Todo => ({
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
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);
  });

  describe('Drag handle', () => {
    it('should render drag handle button with touch-none class', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      const dragHandle = screen.getByLabelText('Drag to reorder');
      expect(dragHandle).toHaveClass('touch-none');
    });

    it('should have cursor-grab class on drag handle', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      const dragHandle = screen.getByLabelText('Drag to reorder');
      expect(dragHandle).toHaveClass('cursor-grab');
    });

    it('should render GripVertical icon in drag handle', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      const dragHandle = screen.getByLabelText('Drag to reorder');
      // GripVertical icon should be rendered inside the button
      const icon = dragHandle.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct aria-label for accessibility', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      const dragHandle = screen.getByLabelText('Drag to reorder');
      expect(dragHandle).toHaveAttribute('aria-label', 'Drag to reorder');
    });
  });

  describe('Component rendering', () => {
    it('should render todo content with correct depth', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={2}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      expect(screen.getByTestId('todo-node-content-1')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should have treeitem role', () => {
      const todo = createMockTodo('1', 'Test Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('should set aria-expanded when hasChildren is true and isExpanded is true', () => {
      const todo = createMockTodo('1', 'Parent Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={true}
          hasChildren={true}
          activeBranchDepths={[]}
        />,
      );

      const treeitem = screen.getByRole('treeitem');
      expect(treeitem).toHaveAttribute('aria-expanded', 'true');
    });

    it('should set aria-expanded to false when hasChildren is true but isExpanded is false', () => {
      const todo = createMockTodo('1', 'Parent Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={true}
          activeBranchDepths={[]}
        />,
      );

      const treeitem = screen.getByRole('treeitem');
      expect(treeitem).toHaveAttribute('aria-expanded', 'false');
    });

    it('should not set aria-expanded when hasChildren is false', () => {
      const todo = createMockTodo('1', 'Leaf Task');

      render(
        <SortableTodoNode
          todo={todo}
          depth={0}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[]}
        />,
      );

      const treeitem = screen.getByRole('treeitem');
      expect(treeitem).not.toHaveAttribute('aria-expanded');
    });

    it('should render branch lines for activeBranchDepths', () => {
      const todo = createMockTodo('1', 'Test Task');

      const { container } = render(
        <SortableTodoNode
          todo={todo}
          depth={2}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[0, 1]}
        />,
      );

      // Should render 2 branch lines (one for each depth in activeBranchDepths)
      const branchLines = container.querySelectorAll('.bg-lattice-line');
      expect(branchLines).toHaveLength(2);
    });

    it('should position branch lines correctly on desktop', () => {
      vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);
      const todo = createMockTodo('1', 'Test Task');

      const { container } = render(
        <SortableTodoNode
          todo={todo}
          depth={2}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[0, 1]}
        />,
      );

      const branchLines = container.querySelectorAll('.bg-lattice-line');

      // Desktop: depth * 24 + 8
      // First line (depth 0): 0 * 24 + 8 = 8px
      expect(branchLines[0]).toHaveStyle({ left: '8px' });
      // Second line (depth 1): 1 * 24 + 8 = 32px
      expect(branchLines[1]).toHaveStyle({ left: '32px' });
    });

    it('should position branch lines correctly on mobile', () => {
      vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);
      const todo = createMockTodo('1', 'Test Task');

      const { container } = render(
        <SortableTodoNode
          todo={todo}
          depth={2}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[0, 1]}
        />,
      );

      const branchLines = container.querySelectorAll('.bg-lattice-line');

      // Mobile: min(depth * 16, 80) + 8
      // First line (depth 0): min(0 * 16, 80) + 8 = 8px
      expect(branchLines[0]).toHaveStyle({ left: '8px' });
      // Second line (depth 1): min(1 * 16, 80) + 8 = 24px
      expect(branchLines[1]).toHaveStyle({ left: '24px' });
    });

    it('should cap mobile branch line position at 88px', () => {
      vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);
      const todo = createMockTodo('1', 'Test Task');

      const { container } = render(
        <SortableTodoNode
          todo={todo}
          depth={10}
          isExpanded={false}
          hasChildren={false}
          activeBranchDepths={[10]}
        />,
      );

      const branchLines = container.querySelectorAll('.bg-lattice-line');

      // Mobile: min(10 * 16, 80) + 8 = 80 + 8 = 88px
      expect(branchLines[0]).toHaveStyle({ left: '88px' });
    });
  });
});
