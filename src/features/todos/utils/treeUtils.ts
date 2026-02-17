import type { Todo } from '../types/todo';

/**
 * Builds a tree structure from a flat array of todos.
 * Time complexity: O(n) using Map for lookups.
 */
export function buildTodoTree(todos: Todo[]): Todo[] {
  if (todos.length === 0) return [];

  const todoMap = new Map<string, Todo>();
  const rootTodos: Todo[] = [];

  // First pass: create map entries with children arrays
  for (const todo of todos) {
    todoMap.set(todo.id, { ...todo, children: [] });
  }

  // Second pass: build parent-child relationships
  for (const todo of todos) {
    const node = todoMap.get(todo.id);
    if (!node) continue;

    if (todo.parentId === null) {
      rootTodos.push(node);
    } else {
      const parent = todoMap.get(todo.parentId);
      if (parent?.children) {
        parent.children.push(node);
      } else {
        // Orphan node - add to root
        rootTodos.push(node);
      }
    }
  }

  // Sort children in-place to avoid unnecessary object copies (fix L8)
  const sortChildren = (nodes: Todo[]): void => {
    nodes.sort((a, b) => a.position - b.position);
    for (const node of nodes) {
      if (node.children?.length) {
        sortChildren(node.children);
      }
    }
  };

  sortChildren(rootTodos);
  return rootTodos;
}

/**
 * Flattens a tree back to a flat array.
 * Useful for rendering virtualized lists.
 */
export function flattenTodoTree(todos: Todo[], expandedIds = new Set<string>()): Todo[] {
  const result: Todo[] = [];

  const traverse = (nodes: Todo[], depth = 0) => {
    for (const node of nodes) {
      result.push({ ...node, depth });

      if (node.children?.length && expandedIds.has(node.id)) {
        traverse(node.children, depth + 1);
      }
    }
  };

  traverse(todos);
  return result;
}

/**
 * Finds a todo in the tree by ID.
 */
export function findTodoInTree(todos: Todo[], id: string): Todo | null {
  for (const todo of todos) {
    if (todo.id === id) return todo;

    if (todo.children?.length) {
      const found = findTodoInTree(todo.children, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Gets all descendant IDs of a todo.
 */
export function getDescendantIds(todo: Todo): string[] {
  const ids: string[] = [];

  const traverse = (node: Todo) => {
    for (const child of node.children ?? []) {
      ids.push(child.id);
      traverse(child);
    }
  };

  traverse(todo);
  return ids;
}

/**
 * Counts total todos including children.
 */
export function countTodos(todos: Todo[]): number {
  let count = 0;

  const traverse = (nodes: Todo[]) => {
    for (const node of nodes) {
      count++;
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };

  traverse(todos);
  return count;
}

/**
 * Filters todos while preserving tree structure.
 * If a child matches, keeps the parent visible.
 */
export function filterTodoTree(todos: Todo[], predicate: (todo: Todo) => boolean): Todo[] {
  const filterNodes = (nodes: Todo[]): Todo[] => {
    const result: Todo[] = [];
    for (const node of nodes) {
      const filteredChildren = filterNodes(node.children ?? []);
      const nodeMatches = predicate(node);
      const hasMatchingChildren = filteredChildren.length > 0;

      if (nodeMatches || hasMatchingChildren) {
        result.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    return result;
  };

  return filterNodes(todos);
}

/**
 * Returns the ancestor chain from root down to (but not including) the given todo.
 * Each entry is { id, title } for breadcrumb rendering.
 */
export function getAncestorPath(tree: Todo[], targetId: string): { id: string; title: string }[] {
  const path: { id: string; title: string }[] = [];

  const search = (nodes: Todo[], ancestors: { id: string; title: string }[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.push(...ancestors);
        return true;
      }
      if (node.children?.length) {
        if (search(node.children, [...ancestors, { id: node.id, title: node.title }])) {
          return true;
        }
      }
    }
    return false;
  };

  search(tree, []);
  return path;
}

/**
 * Sorts a todo tree recursively by the given field and direction.
 * Creates new arrays (immutable) but reuses todo node references.
 *
 * - position / title: sort by the node's own value at every level.
 * - createdAt / updatedAt: sort by the most relevant descendant value
 *   (min for ascending, max for descending) so that a parent whose subtree
 *   contains the earliest/latest date bubbles to the correct position.
 */
export function sortTodoTree(
  todos: Todo[],
  sortBy: 'position' | 'createdAt' | 'updatedAt' | 'title',
  sortOrder: 'asc' | 'desc',
): Todo[] {
  const direction = sortOrder === 'asc' ? 1 : -1;

  // Position and title: sort by node's own value (unchanged behaviour)
  if (sortBy === 'position' || sortBy === 'title') {
    const compareFn = (a: Todo, b: Todo): number => {
      if (sortBy === 'position') {
        return (a.position - b.position) * direction;
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) * direction;
    };

    const sortNodes = (nodes: Todo[]): Todo[] => {
      const sorted = [...nodes].sort(compareFn);
      return sorted.map((node) =>
        node.children?.length ? { ...node, children: sortNodes(node.children) } : node,
      );
    };

    return sortNodes(todos);
  }

  // Date-based sorts: use aggregate descendant value
  const dateField = sortBy; // 'createdAt' | 'updatedAt'
  const useMin = sortOrder === 'asc';
  const aggregateMap = new Map<string, string>();

  // Phase 1: bottom-up O(n) pass – compute the extremum date for every node
  const computeAggregate = (node: Todo): string => {
    let agg = node[dateField];
    if (node.children?.length) {
      for (const child of node.children) {
        const childAgg = computeAggregate(child);
        if (useMin ? childAgg < agg : childAgg > agg) {
          agg = childAgg;
        }
      }
    }
    aggregateMap.set(node.id, agg);
    return agg;
  };

  for (const todo of todos) {
    computeAggregate(todo);
  }

  // Phase 2: sort every level using the precomputed aggregates
  const sortNodes = (nodes: Todo[]): Todo[] => {
    const sorted = [...nodes].sort((a, b) => {
      const aggA = aggregateMap.get(a.id) ?? a[dateField];
      const aggB = aggregateMap.get(b.id) ?? b[dateField];
      return aggA.localeCompare(aggB) * direction;
    });
    return sorted.map((node) =>
      node.children?.length ? { ...node, children: sortNodes(node.children) } : node,
    );
  };

  return sortNodes(todos);
}

/**
 * Gets all descendant IDs from a flat todo list using parentId chains (BFS).
 * Does NOT require a pre-built tree structure.
 */
export function getDescendantIdsFlat(todos: Todo[], targetId: string): Set<string> {
  const descendants = new Set<string>();
  const queue = [targetId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === undefined) break;
    for (const todo of todos) {
      if (todo.parentId === currentId && !descendants.has(todo.id)) {
        descendants.add(todo.id);
        queue.push(todo.id);
      }
    }
  }
  return descendants;
}
