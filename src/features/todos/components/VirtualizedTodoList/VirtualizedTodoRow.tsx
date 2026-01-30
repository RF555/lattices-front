import { memo, type CSSProperties } from 'react';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { TodoNodeContent } from '../TodoNodeContent';
import type { Todo } from '../../types/todo';

interface VirtualizedTodoRowProps {
  todo: Todo;
  style: CSSProperties;
}

export const VirtualizedTodoRow = memo(function VirtualizedTodoRow({
  todo,
  style,
}: VirtualizedTodoRowProps) {
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const isExpanded = expandedIds.has(todo.id);
  const hasChildren = !!todo.children?.length;

  return (
    <div style={style} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <TodoNodeContent
        todo={todo}
        depth={todo.depth ?? 0}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
      />
    </div>
  );
});
