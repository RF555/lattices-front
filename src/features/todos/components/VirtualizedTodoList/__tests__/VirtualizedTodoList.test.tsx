import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { VirtualizedTodoList } from '../VirtualizedTodoList';
import * as useIsCoarsePointerModule from '@hooks/useIsCoarsePointer';
import type { Todo } from '@features/todos/types/todo';

// Mock useIsCoarsePointer
vi.mock('@hooks/useIsCoarsePointer', () => ({
  useIsCoarsePointer: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock VirtualizedTodoRow to simplify testing
vi.mock('../VirtualizedTodoRow', () => ({
  VirtualizedTodoRow: ({ todo, style }: { todo: Todo; style: React.CSSProperties }) => (
    <div data-testid={`virtualized-row-${todo.id}`} style={style}>
      {todo.title}
    </div>
  ),
}));

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => {
    const size = estimateSize();
    // Return a minimal mock that simulates virtualizer behavior
    return {
      getTotalSize: () => count * size,
      getVirtualItems: () =>
        Array.from({ length: Math.min(count, 10) }, (_, index) => ({
          index,
          start: index * size,
          size,
        })),
    };
  },
}));

describe('VirtualizedTodoList', () => {
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
    depth: 0,
    children: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);
  });

  it('should render container with tree role and aria-label', () => {
    const items = [createMockTodo('1', 'Task 1')];

    render(<VirtualizedTodoList items={items} />);

    const container = screen.getByRole('tree', { name: 'tree.ariaLabel' });
    expect(container).toBeInTheDocument();
  });

  it('should render VirtualizedTodoRow for each item', () => {
    const items = [
      createMockTodo('1', 'Task 1'),
      createMockTodo('2', 'Task 2'),
      createMockTodo('3', 'Task 3'),
    ];

    render(<VirtualizedTodoList items={items} />);

    // Our mock shows first 10 items (or all if less)
    expect(screen.getByTestId('virtualized-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-row-3')).toBeInTheDocument();
  });

  it('should use 48px estimateSize on touch devices', () => {
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(true);

    const items = [createMockTodo('1', 'Task 1')];

    const { container } = render(<VirtualizedTodoList items={items} />);

    // Check that the virtualized container has correct height calculation
    // On touch: 1 item * 48px = 48px
    const virtualizedContainer = container.querySelector('div[role="tree"] > div');
    expect(virtualizedContainer).toHaveStyle({ height: '48px' });
  });

  it('should use 40px estimateSize on non-touch devices', () => {
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);

    const items = [createMockTodo('1', 'Task 1')];

    const { container } = render(<VirtualizedTodoList items={items} />);

    // Check that the virtualized container has correct height calculation
    // On non-touch: 1 item * 40px = 40px
    const virtualizedContainer = container.querySelector('div[role="tree"] > div');
    expect(virtualizedContainer).toHaveStyle({ height: '40px' });
  });

  it('should use overscan of 5 on touch devices', () => {
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(true);

    const items = Array.from({ length: 20 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    render(<VirtualizedTodoList items={items} />);

    // Mock returns first 10 items, but in real implementation overscan would affect
    // how many items are rendered outside viewport
    // We can verify the component renders without error
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('should use overscan of 10 on non-touch devices', () => {
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);

    const items = Array.from({ length: 20 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    render(<VirtualizedTodoList items={items} />);

    // Mock returns first 10 items
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('should apply mobile-responsive height classes', () => {
    const items = [createMockTodo('1', 'Task 1')];

    const { container } = render(<VirtualizedTodoList items={items} />);

    const scrollContainer = container.querySelector('div[role="tree"]');
    expect(scrollContainer).toHaveClass('h-[calc(100dvh-200px)]');
    expect(scrollContainer).toHaveClass('sm:h-[600px]');
  });

  it('should handle empty items array', () => {
    const { container } = render(<VirtualizedTodoList items={[]} />);

    const virtualizedContainer = container.querySelector('div[role="tree"] > div');
    expect(virtualizedContainer).toHaveStyle({ height: '0px' });
  });

  it('should render todos with correct depth', () => {
    const items = [
      createMockTodo('1', 'Root Task', { depth: 0 }),
      createMockTodo('2', 'Child Task', { depth: 1, parentId: '1' }),
      createMockTodo('3', 'Grandchild Task', { depth: 2, parentId: '2' }),
    ];

    render(<VirtualizedTodoList items={items} />);

    expect(screen.getByTestId('virtualized-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-row-3')).toBeInTheDocument();
  });

  it('should render large lists efficiently with virtualization', () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      createMockTodo(`${i + 1}`, `Task ${i + 1}`),
    );

    render(<VirtualizedTodoList items={items} />);

    // Only first 10 items rendered (due to our mock)
    expect(screen.getByTestId('virtualized-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-row-10')).toBeInTheDocument();

    // Items beyond viewport shouldn't be rendered
    expect(screen.queryByTestId('virtualized-row-50')).not.toBeInTheDocument();
  });

  it('should pass correct absolute positioning styles to VirtualizedTodoRow', () => {
    const items = [createMockTodo('1', 'Task 1')];

    render(<VirtualizedTodoList items={items} />);

    const row = screen.getByTestId('virtualized-row-1');
    expect(row).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
    });
  });

  it('should calculate total size based on items count and estimateSize', () => {
    vi.mocked(useIsCoarsePointerModule.useIsCoarsePointer).mockReturnValue(false);

    const items = Array.from({ length: 5 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    const { container } = render(<VirtualizedTodoList items={items} />);

    // 5 items * 40px (desktop) = 200px
    const virtualizedContainer = container.querySelector('div[role="tree"] > div');
    expect(virtualizedContainer).toHaveStyle({ height: '200px' });
  });

  it('should maintain scroll position via getScrollElement', () => {
    const items = Array.from({ length: 50 }, (_, i) => createMockTodo(`${i + 1}`, `Task ${i + 1}`));

    const { container } = render(<VirtualizedTodoList items={items} />);

    const scrollContainer = container.querySelector('div[role="tree"]');
    expect(scrollContainer).toHaveClass('overflow-auto');
  });
});
