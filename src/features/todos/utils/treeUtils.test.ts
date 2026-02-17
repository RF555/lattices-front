import { describe, it, expect } from 'vitest';
import {
  buildTodoTree,
  flattenTodoTree,
  findTodoInTree,
  getDescendantIds,
  countTodos,
  filterTodoTree,
  sortTodoTree,
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
    const tree: Todo[] = [{ ...createTodo({ id: '1', title: 'Root' }), children: [] }];

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
            children: [{ ...createTodo({ id: '3', title: 'Deep' }), children: [] }],
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
    const tree: Todo[] = [{ ...createTodo({ id: '1', isCompleted: true }), children: [] }];

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

describe('sortTodoTree', () => {
  describe('position sort', () => {
    it('sorts root nodes by position ascending', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'b', position: 2 }), children: [] },
        { ...createTodo({ id: 'a', position: 0 }), children: [] },
        { ...createTodo({ id: 'c', position: 1 }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'position', 'asc');
      expect(sorted.map((t) => t.id)).toEqual(['a', 'c', 'b']);
    });

    it('sorts root nodes by position descending', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'a', position: 0 }), children: [] },
        { ...createTodo({ id: 'b', position: 2 }), children: [] },
        { ...createTodo({ id: 'c', position: 1 }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'position', 'desc');
      expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a']);
    });

    it('sorts nested children by position', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'p', position: 0 }),
          children: [
            { ...createTodo({ id: 'c2', position: 2 }), children: [] },
            { ...createTodo({ id: 'c0', position: 0 }), children: [] },
            { ...createTodo({ id: 'c1', position: 1 }), children: [] },
          ],
        },
      ];

      const sorted = sortTodoTree(tree, 'position', 'asc');
      expect(sorted[0].children!.map((t) => t.id)).toEqual(['c0', 'c1', 'c2']);
    });
  });

  describe('title sort', () => {
    it('sorts root nodes alphabetically ascending', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'c', title: 'Charlie' }), children: [] },
        { ...createTodo({ id: 'a', title: 'Alpha' }), children: [] },
        { ...createTodo({ id: 'b', title: 'Bravo' }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'title', 'asc');
      expect(sorted.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    });

    it('sorts root nodes alphabetically descending', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'a', title: 'Alpha' }), children: [] },
        { ...createTodo({ id: 'c', title: 'Charlie' }), children: [] },
        { ...createTodo({ id: 'b', title: 'Bravo' }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'title', 'desc');
      expect(sorted.map((t) => t.id)).toEqual(['c', 'b', 'a']);
    });

    it('sorts case-insensitively', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'b', title: 'banana' }), children: [] },
        { ...createTodo({ id: 'a', title: 'Apple' }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'title', 'asc');
      expect(sorted.map((t) => t.id)).toEqual(['a', 'b']);
    });

    it('sorts inner subtrees independently by own title', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'p1', title: 'Zebra' }),
          children: [
            { ...createTodo({ id: 'c2', title: 'Mango' }), children: [] },
            { ...createTodo({ id: 'c1', title: 'Apple' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'p2', title: 'Alpha' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'title', 'asc');
      // Parents sorted by own title: Alpha < Zebra
      expect(sorted[0].id).toBe('p2');
      expect(sorted[1].id).toBe('p1');
      // Children of Zebra sorted by own title: Apple < Mango
      expect(sorted[1].children!.map((t) => t.id)).toEqual(['c1', 'c2']);
    });
  });

  describe('createdAt sort (descendant-aware)', () => {
    it('sorts ascending using min date from subtree', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'a', createdAt: '2026-03-01T00:00:00Z' }),
          children: [
            { ...createTodo({ id: 'a1', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'b', createdAt: '2026-02-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      // 'a' subtree min = 2026-01-01, 'b' = 2026-02-01 → a first
      expect(sorted.map((t) => t.id)).toEqual(['a', 'b']);
    });

    it('sorts descending using max date from subtree', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }),
          children: [
            { ...createTodo({ id: 'a1', createdAt: '2026-06-01T00:00:00Z' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'b', createdAt: '2026-05-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'desc');
      // 'a' subtree max = 2026-06-01, 'b' = 2026-05-01 → a first
      expect(sorted.map((t) => t.id)).toEqual(['a', 'b']);
    });

    it('uses parent own date when it is the extremum', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }),
          children: [
            { ...createTodo({ id: 'a1', createdAt: '2026-03-01T00:00:00Z' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'b', createdAt: '2026-02-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      // 'a' subtree min = 2026-01-01 (parent itself), 'b' = 2026-02-01 → a first
      expect(sorted[0].id).toBe('a');
    });

    it('considers deeply nested descendants (3+ levels)', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'x', createdAt: '2026-06-01T00:00:00Z' }),
          children: [
            {
              ...createTodo({ id: 'x1', createdAt: '2026-05-01T00:00:00Z' }),
              children: [
                { ...createTodo({ id: 'x1a', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
              ],
            },
          ],
        },
        {
          ...createTodo({ id: 'y', createdAt: '2026-02-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      // 'x' subtree min = 2026-01-01 (deepest child), 'y' = 2026-02-01 → x first
      expect(sorted[0].id).toBe('x');
    });

    it('sorts inner subtrees by aggregate as well', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'p', createdAt: '2026-01-01T00:00:00Z' }),
          children: [
            {
              ...createTodo({ id: 'c1', createdAt: '2026-05-01T00:00:00Z' }),
              children: [
                { ...createTodo({ id: 'c1a', createdAt: '2026-04-01T00:00:00Z' }), children: [] },
              ],
            },
            {
              ...createTodo({ id: 'c2', createdAt: '2026-06-01T00:00:00Z' }),
              children: [
                { ...createTodo({ id: 'c2a', createdAt: '2026-02-01T00:00:00Z' }), children: [] },
              ],
            },
          ],
        },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      // c1 subtree min = 2026-04-01, c2 subtree min = 2026-02-01 → c2 first
      expect(sorted[0].children!.map((t) => t.id)).toEqual(['c2', 'c1']);
    });
  });

  describe('updatedAt sort (descendant-aware)', () => {
    it('sorts ascending using min updatedAt from subtree', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'a', updatedAt: '2026-05-01T00:00:00Z' }),
          children: [
            { ...createTodo({ id: 'a1', updatedAt: '2026-01-01T00:00:00Z' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'b', updatedAt: '2026-03-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'updatedAt', 'asc');
      // 'a' subtree min = 2026-01-01, 'b' = 2026-03-01 → a first
      expect(sorted[0].id).toBe('a');
    });

    it('sorts descending using max updatedAt from subtree', () => {
      const tree: Todo[] = [
        {
          ...createTodo({ id: 'a', updatedAt: '2026-02-01T00:00:00Z' }),
          children: [
            { ...createTodo({ id: 'a1', updatedAt: '2026-09-01T00:00:00Z' }), children: [] },
          ],
        },
        {
          ...createTodo({ id: 'b', updatedAt: '2026-07-01T00:00:00Z' }),
          children: [],
        },
      ];

      const sorted = sortTodoTree(tree, 'updatedAt', 'desc');
      // 'a' subtree max = 2026-09-01, 'b' = 2026-07-01 → a first
      expect(sorted[0].id).toBe('a');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      expect(sortTodoTree([], 'createdAt', 'asc')).toEqual([]);
    });

    it('handles single node without children', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'only', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('only');
    });

    it('handles nodes with identical dates', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
        { ...createTodo({ id: 'b', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
      ];

      const sorted = sortTodoTree(tree, 'createdAt', 'asc');
      expect(sorted).toHaveLength(2);
    });

    it('does not mutate the original array', () => {
      const tree: Todo[] = [
        { ...createTodo({ id: 'b', createdAt: '2026-02-01T00:00:00Z' }), children: [] },
        { ...createTodo({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }), children: [] },
      ];

      const originalIds = tree.map((t) => t.id);
      sortTodoTree(tree, 'createdAt', 'asc');
      expect(tree.map((t) => t.id)).toEqual(originalIds);
    });
  });
});
