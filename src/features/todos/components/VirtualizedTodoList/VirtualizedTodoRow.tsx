import { memo, type CSSProperties } from 'react';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import { TodoNodeContent } from '../TodoNodeContent';
import type { Todo } from '@features/todos/types/todo';

interface VirtualizedTodoRowProps {
  todo: Todo;
  style: CSSProperties;
  siblingContext?: { siblings: Todo[]; index: number };
}

export const VirtualizedTodoRow = memo(function VirtualizedTodoRow({
  todo,
  style,
  siblingContext,
}: VirtualizedTodoRowProps) {
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const isExpanded = expandedIds.has(todo.id);
  const hasChildren = !!todo.children?.length;

  return (
    <div
      style={style}
      role="treeitem"
      aria-selected={false}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <TodoNodeContent
        todo={todo}
        depth={todo.depth ?? 0}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        siblings={siblingContext?.siblings}
        siblingIndex={siblingContext?.index}
      />
    </div>
  );
});
