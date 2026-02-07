import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, CornerLeftUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useFlatTodos } from '../../hooks/useTodos';
import { buildTodoTree, getDescendantIdsFlat } from '../../utils/treeUtils';
import type { Todo } from '../../types/todo';

interface ParentPickerProps {
  todoId: string;
  currentParentId: string | null;
  workspaceId?: string;
  onParentChange: (parentId: string | null) => void;
}

export function ParentPicker({
  todoId,
  currentParentId,
  workspaceId,
  onParentChange,
}: ParentPickerProps) {
  const { t } = useTranslation('todos');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: flatTodos = [] } = useFlatTodos(undefined, workspaceId);

  // IDs to exclude: self + all descendants (prevent circular reference)
  const excludedIds = useMemo(() => {
    const descendants = getDescendantIdsFlat(flatTodos, todoId);
    descendants.add(todoId);
    return descendants;
  }, [flatTodos, todoId]);

  // Build tree for display, excluding self and descendants
  const eligibleTree = useMemo(() => {
    const eligible = flatTodos.filter((todo) => !excludedIds.has(todo.id));
    return buildTodoTree(eligible);
  }, [flatTodos, excludedIds]);

  // Find current parent name
  const currentParentName = useMemo(() => {
    if (!currentParentId) return null;
    const parent = flatTodos.find((t) => t.id === currentParentId);
    return parent?.title ?? null;
  }, [flatTodos, currentParentId]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (parentId: string | null) => {
    onParentChange(parentId);
    setIsOpen(false);
    setSearch('');
  };

  const searchLower = search.toLowerCase();

  // Check if a tree node or any of its children match the search
  const matchesSearch = (todo: Todo): boolean => {
    if (todo.title.toLowerCase().includes(searchLower)) return true;
    return todo.children?.some(matchesSearch) ?? false;
  };

  // Render tree nodes recursively
  const renderTreeNodes = (nodes: Todo[], depth = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    for (const node of nodes) {
      if (search && !matchesSearch(node)) continue;

      const isCurrentParent = node.id === currentParentId;

      result.push(
        <button
          key={node.id}
          type="button"
          role="treeitem"
          aria-level={depth + 1}
          aria-selected={isCurrentParent}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-2 sm:py-1.5 text-left text-sm rounded',
            isCurrentParent ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700',
          )}
          style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
          onClick={() => {
            handleSelect(node.id);
          }}
        >
          <span className="truncate">{node.title}</span>
        </button>,
      );

      if (node.children?.length) {
        result.push(...renderTreeNodes(node.children, depth + 1));
      }
    }

    return result;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Closed state: combobox trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="parent-picker-tree"
        aria-haspopup="tree"
        tabIndex={0}
        className={cn(
          'flex items-center gap-2 p-2 min-h-[38px]',
          'border rounded-md cursor-pointer',
          isOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-300',
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={cn('flex-1 text-sm truncate', !currentParentName && 'text-gray-400')}>
          {currentParentName ?? t('detail.parentRootLevel')}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 shrink-0 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="parent-picker-tree"
          role="tree"
          className="absolute z-10 w-full min-w-[200px] mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={t('detail.parentSearchPlaceholder')}
              className="w-full outline-none text-sm px-2 py-1 border border-gray-200 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setSearch('');
                }
              }}
            />
          </div>

          <div className="p-1">
            {/* Move to root option */}
            {currentParentId !== null && (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2 py-2 sm:py-1.5 text-left text-sm rounded hover:bg-gray-100 text-primary font-medium"
                onClick={() => {
                  handleSelect(null);
                }}
              >
                <CornerLeftUp className="w-4 h-4 shrink-0" />
                {t('detail.parentMoveToRoot')}
              </button>
            )}

            {/* Tree nodes */}
            {renderTreeNodes(eligibleTree)}

            {/* Empty state */}
            {eligibleTree.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                {t('detail.parentSearchPlaceholder')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
