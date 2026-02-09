import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TodoTree } from '../TodoTree';
import type { Todo } from '../../../types/todo';
import * as useTodosModule from '../../../hooks/useTodos';
import * as todoUiStoreModule from '../../../stores/todoUiStore';

// Mock hooks and stores
vi.mock('../../../hooks/useTodos');
vi.mock('../../../stores/todoUiStore');
vi.mock('@features/workspaces/stores/workspaceUiStore', () => ({
  useActiveWorkspaceId: () => 'workspace-1',
}));

// Define mock state that can be updated by tests
let mockPullToRefreshState = {
  containerRef: { current: null },
  isPulling: false,
  isRefreshing: false,
  pullProgress: 0,
};

vi.mock('@hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => mockPullToRefreshState,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'pullToRefresh.pull') return 'Pull to refresh';
      if (key === 'pullToRefresh.release') return 'Release to refresh';
      if (key === 'pullToRefresh.refreshing') return 'Refreshing...';
      if (key === 'tree.error') return 'Failed to load todos. Please try again.';
      if (key === 'tree.ariaLabel') return 'Task list';
      if (key === 'empty.defaultTitle') return 'No tasks yet';
      if (key === 'empty.defaultMessage')
        return 'Tasks with a foundation. Create your first task to build your lattice.';
      if (key === 'empty.filteredTitle') return 'No matching tasks';
      if (key === 'empty.filteredMessage') return 'Try adjusting your filters';
      return key;
    },
  }),
}));

// Mock TodoNode
vi.mock('../TodoNode', () => ({
  TodoNode: ({ todo }: { todo: Todo }) => (
    <div data-testid={`todo-node-${todo.id}`}>{todo.title}</div>
  ),
}));

// Mock VirtualizedTodoList
vi.mock('../../VirtualizedTodoList', () => ({
  VirtualizedTodoList: ({ items }: { items: Todo[] }) => (
    <div data-testid="virtualized-list">
      {items.map((item) => (
        <div key={item.id} data-testid={`virtualized-item-${item.id}`}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock TodoTreeEmpty and TodoTreeLoading
vi.mock('../TodoTreeEmpty', () => ({
  TodoTreeEmpty: ({ hasFilters }: { hasFilters: boolean }) => (
    <div data-testid="todo-tree-empty">{hasFilters ? 'No matching tasks' : 'No tasks yet'}</div>
  ),
}));

vi.mock('../TodoTreeLoading', () => ({
  TodoTreeLoading: () => <div data-testid="todo-tree-loading">Loading...</div>,
}));

describe('TodoTree', () => {
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

    // Reset pull-to-refresh mock state
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: false,
      isRefreshing: false,
      pullProgress: 0,
    };

    // Default mock implementations
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [] as Todo[],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(todoUiStoreModule.useExpandedIds).mockReturnValue(new Set());
    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
      searchQuery: '',
      filterTagIds: [],
      showCompleted: true,
      sortBy: 'position' as const,
      sortOrder: 'asc' as const,
    } as ReturnType<typeof todoUiStoreModule.useTodoUiStore>);
  });

  it('should show loading state when data is loading', () => {
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByTestId('todo-tree-loading')).toBeInTheDocument();
  });

  it('should show error message when fetch fails', () => {
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      isSuccess: false,
      isError: true,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByText('Failed to load todos. Please try again.')).toBeInTheDocument();
  });

  it('should show empty state when no todos exist', () => {
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [] as Todo[],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByTestId('todo-tree-empty')).toBeInTheDocument();
  });

  it('should show filtered empty state when filters applied but no matches', () => {
    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [] as Todo[],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
      searchQuery: 'nonexistent',
      filterTagIds: [],
      showCompleted: true,
      sortBy: 'position' as const,
      sortOrder: 'asc' as const,
    } as ReturnType<typeof todoUiStoreModule.useTodoUiStore>);

    render(<TodoTree />);

    expect(screen.getByTestId('todo-tree-empty')).toBeInTheDocument();
    expect(screen.getByText('No matching tasks')).toBeInTheDocument();
  });

  it('should render normal tree when item count is below VIRTUALIZATION_THRESHOLD (50)', () => {
    const todos = Array.from({ length: 10 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    // Should render TodoNode components, not VirtualizedTodoList
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('todo-node-1')).toBeInTheDocument();
  });

  it('should render VirtualizedTodoList when item count exceeds VIRTUALIZATION_THRESHOLD (50)', () => {
    // Create a deep tree that flattens to > 50 items
    const todos = Array.from({ length: 51 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    // Should render VirtualizedTodoList
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.queryByTestId('todo-node-1')).not.toBeInTheDocument();
  });

  it('should filter out completed todos when showCompleted is false', () => {
    const todos = [
      createMockTodo('1', 'Active Task', { isCompleted: false }),
      createMockTodo('2', 'Completed Task', { isCompleted: true }),
    ];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
      searchQuery: '',
      filterTagIds: [],
      showCompleted: false,
      sortBy: 'position' as const,
      sortOrder: 'asc' as const,
    } as ReturnType<typeof todoUiStoreModule.useTodoUiStore>);

    render(<TodoTree />);

    // Only active task should be visible
    expect(screen.getByTestId('todo-node-1')).toBeInTheDocument();
    expect(screen.queryByTestId('todo-node-2')).not.toBeInTheDocument();
  });

  it('should filter by tag IDs when filterTagIds is set', () => {
    const todos = [
      createMockTodo('1', 'Task with Tag', {
        tags: [{ id: 'tag-1', name: 'Important', colorHex: '#ff0000' }],
      }),
      createMockTodo('2', 'Task without Tag', { tags: [] }),
    ];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
      searchQuery: '',
      filterTagIds: ['tag-1'],
      showCompleted: true,
      sortBy: 'position' as const,
      sortOrder: 'asc' as const,
    } as ReturnType<typeof todoUiStoreModule.useTodoUiStore>);

    render(<TodoTree />);

    expect(screen.getByTestId('todo-node-1')).toBeInTheDocument();
    expect(screen.queryByTestId('todo-node-2')).not.toBeInTheDocument();
  });

  it('should filter by search query', () => {
    const todos = [
      createMockTodo('1', 'Important Meeting'),
      createMockTodo('2', 'Grocery Shopping'),
    ];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    vi.mocked(todoUiStoreModule.useTodoUiStore).mockReturnValue({
      searchQuery: 'meeting',
      filterTagIds: [],
      showCompleted: true,
      sortBy: 'position' as const,
      sortOrder: 'asc' as const,
    } as ReturnType<typeof todoUiStoreModule.useTodoUiStore>);

    render(<TodoTree />);

    expect(screen.getByTestId('todo-node-1')).toBeInTheDocument();
    expect(screen.queryByTestId('todo-node-2')).not.toBeInTheDocument();
  });

  it('should not show pull-to-refresh indicator when not pulling or refreshing', () => {
    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.queryByText('Pull to refresh')).not.toBeInTheDocument();
    expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();
  });

  it('should show pull-to-refresh indicator when isPulling', () => {
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: true,
      isRefreshing: false,
      pullProgress: 0.5,
    };

    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
  });

  it('should show "Release to refresh" when pullProgress >= 1', () => {
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: true,
      isRefreshing: false,
      pullProgress: 1,
    };

    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByText('Release to refresh')).toBeInTheDocument();
  });

  it('should show "Refreshing..." when isRefreshing', () => {
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: false,
      isRefreshing: true,
      pullProgress: 0,
    };

    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('should animate RefreshCw icon when isRefreshing', () => {
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: false,
      isRefreshing: true,
      pullProgress: 0,
    };

    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    const { container } = render(<TodoTree />);

    // Find the RefreshCw icon (lucide-react renders as svg)
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('should rotate RefreshCw icon based on pullProgress when pulling', () => {
    mockPullToRefreshState = {
      containerRef: { current: null },
      isPulling: true,
      isRefreshing: false,
      pullProgress: 0.5,
    };

    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    const { container } = render(<TodoTree />);

    // Find the RefreshCw icon
    const icon = container.querySelector('svg');
    expect(icon).toHaveStyle({ transform: 'rotate(180deg)' }); // 0.5 * 360 = 180
  });

  it('should flatten tree for virtualization count check based on expanded IDs', () => {
    const parent = createMockTodo('1', 'Parent', {
      children: Array.from({ length: 60 }, (_, i) =>
        createMockTodo(`child-${i + 1}`, `Child ${i + 1}`, { parentId: '1' }),
      ),
    });

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [parent],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    // When parent is expanded, flattened list is > 50
    vi.mocked(todoUiStoreModule.useExpandedIds).mockReturnValue(new Set(['1']));

    render(<TodoTree />);

    // Should use virtualized list
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('should render normal tree when parent is collapsed (flat count < 50)', () => {
    const parent = createMockTodo('1', 'Parent', {
      children: Array.from({ length: 60 }, (_, i) =>
        createMockTodo(`child-${i + 1}`, `Child ${i + 1}`, { parentId: '1' }),
      ),
    });

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: [parent],
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    // When parent is collapsed, flattened list is just 1 item
    vi.mocked(todoUiStoreModule.useExpandedIds).mockReturnValue(new Set());

    render(<TodoTree />);

    // Should use normal tree
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('todo-node-1')).toBeInTheDocument();
  });

  it('should have role="tree" and aria-label on non-virtualized tree', () => {
    const todos = [createMockTodo('1', 'Task 1')];

    vi.mocked(useTodosModule.useTodos).mockReturnValue({
      data: todos,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as ReturnType<typeof useTodosModule.useTodos>);

    render(<TodoTree />);

    const tree = screen.getByRole('tree', { name: 'Task list' });
    expect(tree).toBeInTheDocument();
  });
});
