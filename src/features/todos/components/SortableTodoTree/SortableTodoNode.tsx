import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@lib/utils/cn';
import { TodoNodeContent } from '../TodoNodeContent';
import type { Todo } from '../../types/todo';

interface SortableTodoNodeProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

/**
 * FIX C5: This component renders a SINGLE flat item.
 * It does NOT recursively render children - the parent SortableTodoTree
 * handles the flat list rendering. Visual depth is via CSS indentation.
 */
export const SortableTodoNode = memo(function SortableTodoNode({
  todo,
  depth,
  isExpanded,
  hasChildren,
}: SortableTodoNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
      depth,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <TodoNodeContent
        todo={todo}
        depth={depth}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        className={cn(
          isDragging && 'opacity-50 bg-gray-100',
          isOver && 'ring-2 ring-primary ring-offset-1'
        )}
        leadingSlot={
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing',
              'p-0.5 text-gray-400 hover:text-gray-600',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-primary rounded'
            )}
            aria-label="Drag to reorder"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.5" />
              <circle cx="11" cy="4" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="11" cy="12" r="1.5" />
            </svg>
          </button>
        }
      />
      {/* FIX C5: No recursive child rendering here.
       * Children are rendered by the parent SortableTodoTree flat list.
       * This ensures SortableContext items match rendered DOM elements. */}
    </div>
  );
});
