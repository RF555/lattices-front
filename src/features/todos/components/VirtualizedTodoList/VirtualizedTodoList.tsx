import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsCoarsePointer } from '@hooks/useIsCoarsePointer';
import { VirtualizedTodoRow } from './VirtualizedTodoRow';
import type { Todo } from '@features/todos/types/todo';

interface VirtualizedTodoListProps {
  items: Todo[];
}

export function VirtualizedTodoList({ items }: VirtualizedTodoListProps) {
  const { t } = useTranslation('todos');
  const parentRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsCoarsePointer();

  // Compute sibling context: group flat items by parentId, assign index within each group
  const siblingContextMap = useMemo(() => {
    const context = new Map<string, { siblings: Todo[]; index: number }>();
    const groups = new Map<string | null, Todo[]>();
    for (const item of items) {
      const key = item.parentId;
      const group = groups.get(key);
      if (group) {
        group.push(item);
      } else {
        groups.set(key, [item]);
      }
    }
    for (const group of groups.values()) {
      for (let i = 0; i < group.length; i++) {
        context.set(group[i].id, { siblings: group, index: i });
      }
    }
    return context;
  }, [items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isTouch ? 48 : 40),
    overscan: isTouch ? 5 : 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100dvh-200px)] sm:h-[600px] overflow-auto"
      role="tree"
      aria-label={t('tree.ariaLabel')}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const todo = items[virtualRow.index];
          return (
            <VirtualizedTodoRow
              key={todo.id}
              todo={todo}
              siblingContext={siblingContextMap.get(todo.id)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
