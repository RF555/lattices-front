import { useMemo, useState, useEffect } from 'react';
import { ChevronsDown, ChevronsUp, SlidersHorizontal, Search, X, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { useTodos } from '../../hooks/useTodos';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { countTodos } from '../../utils/treeUtils';
import { TagFilter } from '../TagFilter';
import { ExportModal } from '../ExportModal';
import type { Todo } from '../../types/todo';

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
    }, 300);
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
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')}
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

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                expandAll(allIds);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={t('toolbar.expandAll')}
            >
              <ChevronsDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                collapseAll();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={t('toolbar.collapseAll')}
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setIsExportModalOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            title={t('export.button')}
          >
            <FileDown className="w-4 h-4" />
          </button>
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

        <button
          onClick={toggleToolbar}
          className="relative p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          aria-label={toolbarExpanded ? t('toolbar.hideFilters') : t('toolbar.showFilters')}
        >
          {toolbarExpanded ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          {/* Active filter indicator dot */}
          {hasActiveFilters && !toolbarExpanded && (
            <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
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
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={sortOrder === 'asc' ? t('toolbar.sortDescending') : t('toolbar.sortAscending')}
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
            <button
              onClick={() => {
                expandAll(allIds);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={t('toolbar.expandAll')}
            >
              <ChevronsDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                collapseAll();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={t('toolbar.collapseAll')}
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsExportModalOpen(true);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title={t('export.button')}
            >
              <FileDown className="w-4 h-4" />
            </button>
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
