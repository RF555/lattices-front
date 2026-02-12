import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@hooks/useIsMobile';
import { VirtualizedTodoRow } from './VirtualizedTodoRow';
import type { Todo } from '@features/todos/types/todo';

interface VirtualizedTodoListProps {
  items: Todo[];
}

export function VirtualizedTodoList({ items }: VirtualizedTodoListProps) {
  const { t } = useTranslation('todos');
  const parentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 48 : 40),
    overscan: isMobile ? 5 : 10,
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
