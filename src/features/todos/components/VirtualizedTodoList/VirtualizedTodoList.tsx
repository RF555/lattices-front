import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { flattenTodoTree } from '../../utils/treeUtils';
import { VirtualizedTodoRow } from './VirtualizedTodoRow';

export function VirtualizedTodoList() {
  const parentRef = useRef<HTMLDivElement>(null);
  // Use useTodos() which applies buildTodoTree() to produce tree-structured data
  const { data: treeTodos = [] } = useTodos();
  const expandedIds = useTodoUiStore((state) => state.expandedIds);

  // Flatten the tree structure respecting expansion state
  const visibleItems = useMemo(
    () => flattenTodoTree(treeTodos, expandedIds),
    [treeTodos, expandedIds],
  );

  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto" role="tree">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const todo = visibleItems[virtualRow.index];
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
