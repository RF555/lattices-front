import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { useTodos } from '../../hooks/useTodos';
import { useTodoUiStore, useExpandedIds } from '../../stores/todoUiStore';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { filterTodoTree, sortTodoTree, flattenTodoTree } from '../../utils/treeUtils';
import { TodoNode } from './TodoNode';
import { TodoTreeEmpty } from './TodoTreeEmpty';
import { TodoTreeLoading } from './TodoTreeLoading';
import { VirtualizedTodoList } from '../VirtualizedTodoList';
import type { PresenceUser } from '@lib/realtime';

const VIRTUALIZATION_THRESHOLD = 50;

interface TodoTreeProps {
  viewingTask?: Map<string, PresenceUser[]>;
}

export function TodoTree({ viewingTask }: TodoTreeProps) {
  const { t } = useTranslation('todos');
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: todos, isLoading, error } = useTodos(undefined, activeWorkspaceId ?? undefined);
  const expandedIds = useExpandedIds();
  // Fix M2: Use useShallow to prevent re-renders
  const { searchQuery, filterTagIds, showCompleted, sortBy, sortOrder } = useTodoUiStore(
    useShallow((s) => ({
      searchQuery: s.searchQuery,
      filterTagIds: s.filterTagIds,
      showCompleted: s.showCompleted,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
    })),
  );

  const filteredTodos = useMemo(() => {
    if (!todos) return [];

    let result = todos;

    if (!showCompleted) {
      result = filterTodoTree(result, (todo) => !todo.isCompleted);
    }

    if (filterTagIds.length > 0) {
      result = filterTodoTree(result, (todo) =>
        filterTagIds.some((tagId) => todo.tags.some((t) => t.id === tagId)),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = filterTodoTree(
        result,
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          (todo.description?.toLowerCase().includes(query) ?? false) ||
          todo.tags.some((t) => t.name.toLowerCase().includes(query)),
      );
    }

    // Apply sorting
    result = sortTodoTree(result, sortBy, sortOrder);

    return result;
  }, [todos, showCompleted, filterTagIds, searchQuery, sortBy, sortOrder]);

  // Flatten for virtual list count check
  const flatItems = useMemo(
    () => flattenTodoTree(filteredTodos, expandedIds),
    [filteredTodos, expandedIds],
  );

  const useVirtualList = flatItems.length > VIRTUALIZATION_THRESHOLD;

  if (isLoading) {
    return <TodoTreeLoading />;
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">{t('tree.error')}</div>;
  }

  if (!filteredTodos.length) {
    return <TodoTreeEmpty hasFilters={!!(searchQuery || filterTagIds.length)} />;
  }

  return (
    <div>
      {useVirtualList ? (
        <VirtualizedTodoList items={flatItems} />
      ) : (
        <div className="space-y-1" role="tree" aria-label={t('tree.ariaLabel')}>
          {filteredTodos.map((todo) => (
            <TodoNode
              key={todo.id}
              todo={todo}
              depth={0}
              isExpanded={expandedIds.has(todo.id)}
              viewingTask={viewingTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
