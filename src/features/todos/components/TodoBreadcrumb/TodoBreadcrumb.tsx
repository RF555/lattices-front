import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { useTodos } from '../../hooks/useTodos';
import { getAncestorPath } from '../../utils/treeUtils';

interface TodoBreadcrumbProps {
  todoId: string;
}

export function TodoBreadcrumb({ todoId }: TodoBreadcrumbProps) {
  const { t } = useTranslation('todos');
  const { data: todos } = useTodos();
  const setSelectedId = useTodoUiStore((s) => s.setSelectedId);

  const ancestors = useMemo(() => {
    if (!todos) return [];
    return getAncestorPath(todos, todoId);
  }, [todos, todoId]);

  if (ancestors.length === 0) return null;

  return (
    <nav
      aria-label={t('breadcrumb.ariaLabel')}
      className="flex items-center gap-1 text-xs text-gray-400 overflow-x-auto scrollbar-hide"
    >
      {ancestors.map((ancestor, index) => (
        <span key={ancestor.id} className="flex items-center gap-1 shrink-0">
          {index > 0 && <ChevronRight className="w-3 h-3 shrink-0 rtl:-scale-x-100" />}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(ancestor.id);
            }}
            className="hover:text-gray-600 hover:underline truncate max-w-[80px] sm:max-w-[120px]"
            title={ancestor.title}
          >
            {ancestor.title}
          </button>
        </span>
      ))}
      <ChevronRight className="w-3 h-3 shrink-0 rtl:-scale-x-100" />
    </nav>
  );
}
