import { useMemo, useState, useEffect } from 'react';
import { SquareMinus, SquarePlus, SlidersHorizontal, Search, X, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEBOUNCE } from '@/constants';
import { Tooltip } from '@components/ui/Tooltip';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import { useTodos } from '@features/todos/hooks/useTodos';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { countTodos } from '@features/todos/utils/treeUtils';
import { TagFilter } from '../TagFilter';
import { ExportModal } from '@features/todos/components/ExportModal';
import type { Todo } from '@features/todos/types/todo';

export function TodoToolbar() {
  const { t } = useTranslation('todos');
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: todos } = useTodos(undefined, activeWorkspaceId ?? undefined);
  const {
    showCompleted,
    setShowCompleted,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    expandedIds,
    expandAll,
    collapseAll,
    filterTagIds,
    toolbarExpanded,
    toggleToolbar,
  } = useTodoUiStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fix M11: Debounce search input (300ms)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, DEBOUNCE.SEARCH);
    return () => {
      clearTimeout(timer);
    };
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

  const hasAnyExpanded = expandedIds.size > 0;

  const hasActiveFilters =
    searchQuery.length > 0 || filterTagIds.length > 0 || !showCompleted || sortBy !== 'position';

  return (
    <div className="space-y-0 border-b border-gray-200">
      {/* ── Desktop toolbar (sm+) ── */}
      <div className="hidden sm:flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {t('toolbar.taskCount', { count: totalCount })}
          </span>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => {
                setShowCompleted(e.target.checked);
              }}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t('toolbar.showCompleted')}
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort controls */}
          <div className="flex items-center gap-1">
            <Tooltip content={t('tooltips.sortBy')}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'position' | 'createdAt' | 'updatedAt' | 'title');
                }}
                className="text-sm rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-primary focus:ring-primary focus:outline-none focus:ring-1 bg-white"
              >
                <option value="position">{t('toolbar.sortManual')}</option>
                <option value="createdAt">{t('toolbar.sortDate')}</option>
                <option value="updatedAt">{t('toolbar.sortUpdated')}</option>
                <option value="title">{t('toolbar.sortAlpha')}</option>
              </select>
            </Tooltip>
            <Tooltip
              content={
                sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')
              }
            >
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                aria-label={
                  sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')
                }
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  {sortOrder === 'asc' ? (
                    <path
                      d="M8 3v10M4 7l4-4 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M8 13V3M4 9l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            </Tooltip>
          </div>

          <input
            type="search"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
            }}
            placeholder={t('toolbar.searchPlaceholder')}
            className="text-sm rounded-md border border-gray-300 px-3 py-1.5 shadow-sm focus:border-primary focus:ring-primary focus:outline-none focus:ring-1"
          />

          <Tooltip content={hasAnyExpanded ? t('toolbar.collapseAll') : t('toolbar.expandAll')}>
            <button
              onClick={() => {
                if (hasAnyExpanded) {
                  collapseAll();
                } else {
                  expandAll(allIds);
                }
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              aria-label={hasAnyExpanded ? t('toolbar.collapseAll') : t('toolbar.expandAll')}
            >
              {hasAnyExpanded ? (
                <SquareMinus className="w-4 h-4" />
              ) : (
                <SquarePlus className="w-4 h-4" />
              )}
            </button>
          </Tooltip>

          <Tooltip content={t('export.button')}>
            <button
              onClick={() => {
                setIsExportModalOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              aria-label={t('export.button')}
            >
              <FileDown className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Desktop tag filter row */}
      <div className="hidden sm:block px-4 pb-3">
        <TagFilter />
      </div>

      {/* ── Mobile toolbar (<sm) ── */}
      <div className="flex sm:hidden items-center justify-between px-3 py-2.5">
        <span className="text-sm text-gray-600">
          {t('toolbar.taskCount', { count: totalCount })}
        </span>

        <Tooltip content={toolbarExpanded ? t('toolbar.hideFilters') : t('toolbar.showFilters')}>
          <button
            onClick={toggleToolbar}
            className="relative p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            aria-label={toolbarExpanded ? t('toolbar.hideFilters') : t('toolbar.showFilters')}
          >
            {toolbarExpanded ? (
              <X className="w-5 h-5" />
            ) : (
              <SlidersHorizontal className="w-5 h-5" />
            )}
            {/* Active filter indicator dot */}
            {hasActiveFilters && !toolbarExpanded && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Mobile expanded panel */}
      {toolbarExpanded && (
        <div className="sm:hidden px-3 pb-3 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
              }}
              placeholder={t('toolbar.searchPlaceholder')}
              className="w-full text-sm rounded-md border border-gray-300 ps-8 pe-3 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none focus:ring-1"
            />
          </div>

          {/* Show completed */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => {
                setShowCompleted(e.target.checked);
              }}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t('toolbar.showCompleted')}
          </label>

          {/* Sort + expand/collapse row */}
          <div className="flex items-center gap-2">
            <Tooltip content={t('tooltips.sortBy')}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'position' | 'createdAt' | 'updatedAt' | 'title');
                }}
                className="flex-1 text-sm rounded-md border border-gray-300 px-2 py-2 shadow-sm focus:border-primary focus:ring-primary focus:outline-none focus:ring-1 bg-white"
              >
                <option value="position">{t('toolbar.sortManual')}</option>
                <option value="createdAt">{t('toolbar.sortDate')}</option>
                <option value="updatedAt">{t('toolbar.sortUpdated')}</option>
                <option value="title">{t('toolbar.sortAlpha')}</option>
              </select>
            </Tooltip>
            <Tooltip
              content={
                sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')
              }
            >
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                aria-label={
                  sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')
                }
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  {sortOrder === 'asc' ? (
                    <path
                      d="M8 3v10M4 7l4-4 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M8 13V3M4 9l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            </Tooltip>
            <Tooltip content={hasAnyExpanded ? t('toolbar.collapseAll') : t('toolbar.expandAll')}>
              <button
                onClick={() => {
                  if (hasAnyExpanded) {
                    collapseAll();
                  } else {
                    expandAll(allIds);
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                aria-label={hasAnyExpanded ? t('toolbar.collapseAll') : t('toolbar.expandAll')}
              >
                {hasAnyExpanded ? (
                  <SquareMinus className="w-4 h-4" />
                ) : (
                  <SquarePlus className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
            <Tooltip content={t('export.button')}>
              <button
                onClick={() => {
                  setIsExportModalOpen(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                aria-label={t('export.button')}
              >
                <FileDown className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {/* Tag filter */}
          <TagFilter />
        </div>
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
        }}
      />
    </div>
  );
}
