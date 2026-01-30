import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTodos } from '../../hooks/useTodos';
import { useTodoUiStore, useExpandedIds } from '../../stores/todoUiStore';
import { filterTodoTree } from '../../utils/treeUtils';
import { TodoNode } from './TodoNode';
import { TodoTreeEmpty } from './TodoTreeEmpty';
import { TodoTreeLoading } from './TodoTreeLoading';

export function TodoTree() {
  const { data: todos, isLoading, error } = useTodos();
  const expandedIds = useExpandedIds();
  // Fix M2: Use useShallow to prevent re-renders
  const { searchQuery, filterTagIds, showCompleted } = useTodoUiStore(
    useShallow((s) => ({
      searchQuery: s.searchQuery,
      filterTagIds: s.filterTagIds,
      showCompleted: s.showCompleted,
    }))
  );

  const filteredTodos = useMemo(() => {
    if (!todos) return [];

    let result = todos;

    if (!showCompleted) {
      result = filterTodoTree(result, (todo) => !todo.isCompleted);
    }

    if (filterTagIds.length > 0) {
      result = filterTodoTree(
        result,
        (todo) => filterTagIds.some((tagId) => todo.tags?.some((t) => t.id === tagId))
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = filterTodoTree(
        result,
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          (todo.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return result;
  }, [todos, showCompleted, filterTagIds, searchQuery]);

  if (isLoading) {
    return <TodoTreeLoading />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Failed to load todos. Please try again.
      </div>
    );
  }

  if (!filteredTodos.length) {
    return <TodoTreeEmpty hasFilters={!!(searchQuery || filterTagIds.length)} />;
  }

  return (
    <div className="space-y-1" role="tree" aria-label="Task list">
      {filteredTodos.map((todo) => (
        <TodoNode
          key={todo.id}
          todo={todo}
          depth={0}
          isExpanded={expandedIds.has(todo.id)}
        />
      ))}
    </div>
  );
}
