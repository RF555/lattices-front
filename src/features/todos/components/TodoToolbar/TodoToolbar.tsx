import { useMemo, useState, useEffect } from 'react';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { useTodos } from '../../hooks/useTodos';
import { countTodos } from '../../utils/treeUtils';
import { TagFilter } from '../TagFilter';
import type { Todo } from '../../types/todo';

export function TodoToolbar() {
  const { data: todos } = useTodos();
  const {
    showCompleted,
    setShowCompleted,
    searchQuery,
    setSearchQuery,
    expandAll,
    collapseAll,
  } = useTodoUiStore();

  // Fix M11: Debounce search input (300ms)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const totalCount = todos ? countTodos(todos) : 0;

  // Fix M7: Recursively collect ALL IDs at all depths
  const allIds = useMemo(() => {
    if (!todos) return [];
    const ids: string[] = [];
    const collectIds = (nodes: Todo[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        if (node.children?.length) {
          collectIds(node.children);
        }
      }
    };
    collectIds(todos);
    return ids;
  }, [todos]);

  return (
    <div className="space-y-0 border-b border-gray-200">
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
        </span>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          Show completed
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search tasks..."
          className="text-sm rounded-md border border-gray-300 px-3 py-1.5 shadow-sm focus:border-primary focus:ring-primary focus:outline-none focus:ring-1"
        />

        <div className="flex items-center gap-1">
          <button
            onClick={() => expandAll(allIds)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            title="Expand all"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 6l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={() => collapseAll()}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            title="Collapse all"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 10l5-5 5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div className="px-4 pb-3">
      <TagFilter />
    </div>
    </div>
  );
}
