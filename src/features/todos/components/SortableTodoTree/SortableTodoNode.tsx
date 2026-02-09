import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { useIsMobile } from '@hooks/useIsMobile';
import { TodoNodeContent } from '../TodoNodeContent';
import type { Todo } from '../../types/todo';

interface SortableTodoNodeProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  activeBranchDepths: number[];
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
  activeBranchDepths,
}: SortableTodoNodeProps) {
  const isMobile = useIsMobile();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
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
      aria-selected={false}
      aria-expanded={hasChildren ? isExpanded : undefined}
      className="relative"
    >
      {activeBranchDepths.map((d) => (
        <div
          key={d}
          className="absolute top-0 bottom-0 w-px bg-lattice-line pointer-events-none"
          style={{ left: `${(isMobile ? Math.min(d * 16, 80) : d * 24) + 8}px` }}
          aria-hidden="true"
        />
      ))}
      <TodoNodeContent
        todo={todo}
        depth={depth}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        className={cn(
          isDragging && 'opacity-50 bg-gray-100',
          isOver && 'ring-2 ring-primary ring-offset-1',
        )}
        leadingSlot={
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing touch-none',
              'p-1 sm:p-0.5 text-gray-400 hover:text-gray-600',
              'sm:opacity-0 sm:group-hover:opacity-100 transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-primary rounded',
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        }
      />
      {/* FIX C5: No recursive child rendering here.
       * Children are rendered by the parent SortableTodoTree flat list.
       * This ensures SortableContext items match rendered DOM elements. */}
    </div>
  );
});
