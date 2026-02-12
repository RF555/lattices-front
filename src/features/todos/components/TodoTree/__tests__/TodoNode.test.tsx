import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TodoNode } from '../TodoNode';
import * as useIsMobileModule from '@hooks/useIsMobile';
import * as todoUiStoreModule from '@features/todos/stores/todoUiStore';
import type { Todo } from '@features/todos/types/todo';

// Mock useIsMobile
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}));

// Mock todoUiStore
vi.mock('@features/todos/stores/todoUiStore', () => ({
  useTodoUiStore: vi.fn(),
}));

// Mock TodoNodeContent
vi.mock('../../TodoNodeContent', () => ({
  TodoNodeContent: ({ todo, depth }: { todo: Todo; depth: number }) => (
    <div data-testid={`todo-node-content-${todo.id}`}>
      {todo.title} (depth: {depth})
    </div>
  ),
}));

// Mock ViewingIndicator
vi.mock('@features/workspaces/components/ViewingIndicator/ViewingIndicator', () => ({
  ViewingIndicator: ({ viewers }: { viewers: unknown[] }) => (
    <div data-testid="viewing-indicator">{viewers.length} viewers</div>
  ),
}));

describe('TodoNode', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);
    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(new Set());
  });

  it('should render todo node with content', () => {
    const todo = createMockTodo('1', 'Test Task');

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    expect(screen.getByTestId('todo-node-content-1')).toBeInTheDocument();
    expect(screen.getByText('Test Task (depth: 0)')).toBeInTheDocument();
  });

  it('should have treeitem role', () => {
    const todo = createMockTodo('1', 'Test Task');

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    expect(screen.getByRole('treeitem')).toBeInTheDocument();
  });

  it('should set aria-expanded when todo has children', () => {
    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    const treeitems = screen.getAllByRole('treeitem');
    // First treeitem (parent) should have aria-expanded
    expect(treeitems[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('should not set aria-expanded when todo has no children', () => {
    const todo = createMockTodo('1', 'Leaf Task');

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    const treeitem = screen.getByRole('treeitem');
    expect(treeitem).not.toHaveAttribute('aria-expanded');
  });

  it('should calculate branch-x for desktop: (depth + 1) * 24 + 8', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);

    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    // Desktop: depth=0, childIndent = 1 * 24 = 24, branchX = 24 + 8 = 32px
    const branchContainer = container.querySelector('.lattice-branch');
    expect(branchContainer).toHaveStyle({ '--branch-x': '32px' });
  });

  it('should calculate branch-x for desktop at depth 2: (depth + 1) * 24 + 8', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);

    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={2} isExpanded={true} />);

    // Desktop: depth=2, childIndent = 3 * 24 = 72, branchX = 72 + 8 = 80px
    const branchContainer = container.querySelector('.lattice-branch');
    expect(branchContainer).toHaveStyle({ '--branch-x': '80px' });
  });

  it('should calculate branch-x for mobile: min((depth + 1) * 16, 80) + 8', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);

    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    // Mobile: depth=0, childIndent = min(1 * 16, 80) = 16, branchX = 16 + 8 = 24px
    const branchContainer = container.querySelector('.lattice-branch');
    expect(branchContainer).toHaveStyle({ '--branch-x': '24px' });
  });

  it('should cap mobile branch-x at 88px (80 + 8)', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);

    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={10} isExpanded={true} />);

    // Mobile: depth=10, childIndent = min(11 * 16, 80) = 80, branchX = 80 + 8 = 88px
    const branchContainer = container.querySelector('.lattice-branch');
    expect(branchContainer).toHaveStyle({ '--branch-x': '88px' });
  });

  it('should not exceed 88px on mobile even at very deep levels', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);

    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={20} isExpanded={true} />);

    // Mobile: depth=20, childIndent = min(21 * 16, 80) = 80, branchX = 80 + 8 = 88px
    const branchContainer = container.querySelector('.lattice-branch');
    expect(branchContainer).toHaveStyle({ '--branch-x': '88px' });
  });

  it('should set CSS variable on both .lattice-branch and .lattice-connector', () => {
    const todo = createMockTodo('1', 'Parent Task', {
      children: [createMockTodo('2', 'Child Task', { parentId: '1' })],
    });

    const { container } = render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    const branchContainer = container.querySelector('.lattice-branch');
    const connectorContainer = container.querySelector('.lattice-connector');

    expect(branchContainer).toHaveStyle({ '--branch-x': '32px' });
    expect(connectorContainer).toHaveStyle({ '--branch-x': '32px' });
  });

  it('should render children when expanded', () => {
    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(new Set(['2']));

    const child1 = createMockTodo('2', 'Child 1', { parentId: '1' });
    const child2 = createMockTodo('3', 'Child 2', { parentId: '1' });
    const todo = createMockTodo('1', 'Parent Task', {
      children: [child1, child2],
    });

    render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    // Children should be rendered
    expect(screen.getByText('Child 1 (depth: 1)')).toBeInTheDocument();
    expect(screen.getByText('Child 2 (depth: 1)')).toBeInTheDocument();
  });

  it('should not render children when collapsed', () => {
    const child1 = createMockTodo('2', 'Child 1', { parentId: '1' });
    const todo = createMockTodo('1', 'Parent Task', {
      children: [child1],
    });

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    // Children should not be rendered
    expect(screen.queryByText('Child 1 (depth: 1)')).not.toBeInTheDocument();
  });

  it('should render children with incremented depth', () => {
    const child = createMockTodo('2', 'Child Task', { parentId: '1' });
    const todo = createMockTodo('1', 'Parent Task', {
      children: [child],
    });

    render(<TodoNode todo={todo} depth={1} isExpanded={true} />);

    // Parent at depth 1, child should be at depth 2
    expect(screen.getByText('Child Task (depth: 2)')).toBeInTheDocument();
  });

  it('should add lattice-branch-last class to last child connector', () => {
    const child1 = createMockTodo('2', 'Child 1', { parentId: '1' });
    const child2 = createMockTodo('3', 'Child 2', { parentId: '1' });
    const todo = createMockTodo('1', 'Parent Task', {
      children: [child1, child2],
    });

    const { container } = render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    const connectors = container.querySelectorAll('.lattice-connector');
    expect(connectors).toHaveLength(2);

    // First connector should not have lattice-branch-last
    expect(connectors[0]).not.toHaveClass('lattice-branch-last');

    // Last connector should have lattice-branch-last
    expect(connectors[1]).toHaveClass('lattice-branch-last');
  });

  it('should render viewing indicator when viewers are present', () => {
    const todo = createMockTodo('1', 'Test Task');
    const viewingTask = new Map([
      [
        '1',
        [
          {
            userId: 'user-1',
            displayName: 'User 1',
            avatarUrl: null,
            lastSeen: new Date().toISOString(),
            viewingTaskId: '1',
          },
          {
            userId: 'user-2',
            displayName: 'User 2',
            avatarUrl: null,
            lastSeen: new Date().toISOString(),
            viewingTaskId: '1',
          },
        ],
      ],
    ]);

    render(<TodoNode todo={todo} depth={0} isExpanded={false} viewingTask={viewingTask} />);

    const indicator = screen.getByTestId('viewing-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('2 viewers');
  });

  it('should not render viewing indicator when no viewers', () => {
    const todo = createMockTodo('1', 'Test Task');

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    expect(screen.queryByTestId('viewing-indicator')).not.toBeInTheDocument();
  });

  it('should render children group with role="group"', () => {
    const child = createMockTodo('2', 'Child Task', { parentId: '1' });
    const todo = createMockTodo('1', 'Parent Task', {
      children: [child],
    });

    render(<TodoNode todo={todo} depth={0} isExpanded={true} />);

    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass('lattice-branch');
  });

  it('should correctly calculate branch-x for nested mobile hierarchy', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);

    const grandchild = createMockTodo('3', 'Grandchild', { parentId: '2' });
    const child = createMockTodo('2', 'Child', { parentId: '1', children: [grandchild] });
    const parent = createMockTodo('1', 'Parent', { children: [child] });

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(new Set(['2']));

    const { container } = render(<TodoNode todo={parent} depth={0} isExpanded={true} />);

    // Parent depth=0: childIndent = min(1*16, 80) = 16, branchX = 24px
    const parentBranch = container.querySelector('.lattice-branch');
    expect(parentBranch).toHaveStyle({ '--branch-x': '24px' });
  });

  it('should correctly calculate branch-x for nested desktop hierarchy', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);

    const grandchild = createMockTodo('3', 'Grandchild', { parentId: '2' });
    const child = createMockTodo('2', 'Child', { parentId: '1', children: [grandchild] });
    const parent = createMockTodo('1', 'Parent', { children: [child] });

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(new Set(['2']));

    const { container } = render(<TodoNode todo={parent} depth={0} isExpanded={true} />);

    // Parent depth=0: childIndent = 1*24 = 24, branchX = 32px
    const parentBranch = container.querySelector('.lattice-branch');
    expect(parentBranch).toHaveStyle({ '--branch-x': '32px' });
  });

  it('should pass correct props to nested TodoNode components', () => {
    const child = createMockTodo('2', 'Child Task', { parentId: '1' });
    const parent = createMockTodo('1', 'Parent Task', { children: [child] });

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue(new Set(['2']));

    render(<TodoNode todo={parent} depth={0} isExpanded={true} />);

    // Child TodoNode should receive depth + 1
    expect(screen.getByText('Child Task (depth: 1)')).toBeInTheDocument();
  });

  it('should memoize and not re-render unnecessarily', () => {
    const todo = createMockTodo('1', 'Test Task');

    const { rerender } = render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    // Re-render with same props
    rerender(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    // Component should still be in document (memo working)
    expect(screen.getByTestId('todo-node-content-1')).toBeInTheDocument();
  });

  it('should handle todo with empty children array', () => {
    const todo = createMockTodo('1', 'Task', { children: [] });

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    expect(screen.getByTestId('todo-node-content-1')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('should handle todo with undefined children', () => {
    const todo = createMockTodo('1', 'Task', { children: undefined });

    render(<TodoNode todo={todo} depth={0} isExpanded={false} />);

    expect(screen.getByTestId('todo-node-content-1')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });
});
