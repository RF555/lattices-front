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
    const node = todoMap.get(todo.id)!;

    if (todo.parentId === null) {
      rootTodos.push(node);
    } else {
      const parent = todoMap.get(todo.parentId);
      if (parent) {
        parent.children!.push(node);
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
export function flattenTodoTree(
  todos: Todo[],
  expandedIds: Set<string> = new Set()
): Todo[] {
  const result: Todo[] = [];

  const traverse = (nodes: Todo[], depth: number = 0) => {
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
    for (const child of node.children || []) {
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
export function filterTodoTree(
  todos: Todo[],
  predicate: (todo: Todo) => boolean
): Todo[] {
  const filterNodes = (nodes: Todo[]): Todo[] => {
    const result: Todo[] = [];
    for (const node of nodes) {
      const filteredChildren = filterNodes(node.children || []);
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
