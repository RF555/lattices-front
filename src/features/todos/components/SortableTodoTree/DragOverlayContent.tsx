import { cn } from '@lib/utils/cn';
import type { Todo } from '../../types/todo';

interface DragOverlayContentProps {
  todo: Todo;
}

export function DragOverlayContent({ todo }: DragOverlayContentProps) {
  const isCompleted = todo.isCompleted;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md',
        'bg-white shadow-lg border border-gray-200',
        'opacity-90',
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded border',
          isCompleted ? 'bg-primary border-primary' : 'border-gray-300',
        )}
      />
      <span className={cn('text-sm', isCompleted && 'line-through text-gray-500')}>
        {todo.title}
      </span>
    </div>
  );
}
