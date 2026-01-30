import { describe, it, expect } from 'vitest';
import {
  buildTodoTree,
  flattenTodoTree,
  findTodoInTree,
  getDescendantIds,
  countTodos,
  filterTodoTree,
} from './treeUtils';
import type { Todo } from '../types/todo';

const createTodo = (partial: Partial<Todo>): Todo => ({
  id: 'test-id',
  title: 'Test Todo',
  description: null,
  isCompleted: false,
  parentId: null,
  position: 0,
  completedAt: null,
  childCount: 0,
  completedChildCount: 0,
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...partial,
});

describe('buildTodoTree', () => {
  it('builds tree from flat array', () => {
    const todos: Todo[] = [
      createTodo({ id: '1', title: 'Root 1', parentId: null, position: 0 }),
      createTodo({ id: '2', title: 'Root 2', parentId: null, position: 1 }),
      createTodo({ id: '3', title: 'Child 1', parentId: '1', position: 0 }),
      createTodo({ id: '4', title: 'Child 2', parentId: '1', position: 1 }),
    ];

    const tree = buildTodoTree(todos);

    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].id).toBe('3');
    expect(tree[1].id).toBe('2');
    expect(tree[1].children).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(buildTodoTree([])).toEqual([]);
  });

  it('handles orphan nodes', () => {
    const todos: Todo[] = [
      createTodo({ id: '1', title: 'Orphan', parentId: 'nonexistent', position: 0 }),
    ];

    const tree = buildTodoTree(todos);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
  });
});

describe('flattenTodoTree', () => {
  it('flattens tree respecting expanded state', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1' }),
        children: [{ ...createTodo({ id: '2' }), children: [] }],
      },
    ];

    const expanded = flattenTodoTree(tree, new Set(['1']));
    expect(expanded).toHaveLength(2);

    const collapsed = flattenTodoTree(tree, new Set());
    expect(collapsed).toHaveLength(1);
  });
});

describe('findTodoInTree', () => {
  it('finds nested todo', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1' }),
        children: [{ ...createTodo({ id: '2', title: 'Found' }), children: [] }],
      },
    ];

    const found = findTodoInTree(tree, '2');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Found');
  });

  it('returns null for missing id', () => {
    expect(findTodoInTree([], 'missing')).toBeNull();
  });

  it('finds root-level todo', () => {
    const tree: Todo[] = [
      { ...createTodo({ id: '1', title: 'Root' }), children: [] },
    ];

    const found = findTodoInTree(tree, '1');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Root');
  });

  it('finds deeply nested todo', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1' }),
        children: [
          {
            ...createTodo({ id: '2' }),
            children: [
              { ...createTodo({ id: '3', title: 'Deep' }), children: [] },
            ],
          },
        ],
      },
    ];

    const found = findTodoInTree(tree, '3');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Deep');
  });
});

describe('getDescendantIds', () => {
  it('should return all descendant IDs', () => {
    const todo: Todo = {
      ...createTodo({ id: '1' }),
      children: [
        {
          ...createTodo({ id: '2' }),
          children: [{ ...createTodo({ id: '3' }), children: [] }],
        },
        { ...createTodo({ id: '4' }), children: [] },
      ],
    };

    const ids = getDescendantIds(todo);
    expect(ids).toEqual(['2', '3', '4']);
  });

  it('should return empty array for todo without children', () => {
    const todo = createTodo({ id: '1' });
    const ids = getDescendantIds(todo);
    expect(ids).toEqual([]);
  });

  it('should handle deeply nested children', () => {
    const todo: Todo = {
      ...createTodo({ id: '1' }),
      children: [
        {
          ...createTodo({ id: '2' }),
          children: [
            {
              ...createTodo({ id: '3' }),
              children: [{ ...createTodo({ id: '4' }), children: [] }],
            },
          ],
        },
      ],
    };

    const ids = getDescendantIds(todo);
    expect(ids).toEqual(['2', '3', '4']);
  });
});

describe('countTodos', () => {
  it('should count all todos in tree', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1' }),
        children: [
          { ...createTodo({ id: '2' }), children: [] },
          { ...createTodo({ id: '3' }), children: [] },
        ],
      },
      { ...createTodo({ id: '4' }), children: [] },
    ];

    expect(countTodos(tree)).toBe(4);
  });

  it('should return 0 for empty tree', () => {
    expect(countTodos([])).toBe(0);
  });

  it('should count deeply nested todos', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1' }),
        children: [
          {
            ...createTodo({ id: '2' }),
            children: [
              {
                ...createTodo({ id: '3' }),
                children: [{ ...createTodo({ id: '4' }), children: [] }],
              },
            ],
          },
        ],
      },
    ];

    expect(countTodos(tree)).toBe(4);
  });
});

describe('filterTodoTree', () => {
  it('should filter todos by predicate', () => {
    const tree: Todo[] = [
      { ...createTodo({ id: '1', isCompleted: true }), children: [] },
      { ...createTodo({ id: '2', isCompleted: false }), children: [] },
    ];

    const filtered = filterTodoTree(tree, (todo) => !todo.isCompleted);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });

  it('should preserve parent if child matches', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1', isCompleted: true }),
        children: [{ ...createTodo({ id: '2', isCompleted: false }), children: [] }],
      },
    ];

    const filtered = filterTodoTree(tree, (todo) => !todo.isCompleted);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1'); // Parent kept because child matches
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children![0].id).toBe('2');
  });

  it('should return empty array if no matches', () => {
    const tree: Todo[] = [
      { ...createTodo({ id: '1', isCompleted: true }), children: [] },
    ];

    const filtered = filterTodoTree(tree, (todo) => !todo.isCompleted);
    expect(filtered).toHaveLength(0);
  });

  it('should handle complex nested filtering', () => {
    const tree: Todo[] = [
      {
        ...createTodo({ id: '1', title: 'Parent' }),
        children: [
          {
            ...createTodo({ id: '2', title: 'Match' }),
            children: [{ ...createTodo({ id: '3', title: 'Other' }), children: [] }],
          },
          { ...createTodo({ id: '4', title: 'Nope' }), children: [] },
        ],
      },
    ];

    const filtered = filterTodoTree(tree, (todo) => todo.title === 'Match');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1'); // Parent kept
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children![0].id).toBe('2'); // Matching child
  });
});
