import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '@lib/utils/cn';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from '../../hooks/useTodos';
import { TodoCheckbox } from '../TodoTree/TodoCheckbox';
import { TodoExpandButton } from '../TodoTree/TodoExpandButton';
import { TodoActions } from '../TodoTree/TodoActions';
import { TodoInlineEdit } from '../TodoTree/TodoInlineEdit';
import { ConfirmationDialog } from '@components/feedback/ConfirmationDialog';
import { TodoDetailPanel } from '../TodoDetailPanel';
import type { Todo } from '../../types/todo';

interface TodoNodeContentProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  /** Optional leading content (e.g., drag handle for SortableTodoNode) */
  leadingSlot?: ReactNode;
  /** Additional class names for the row container */
  className?: string;
  /** Inline style for the row container */
  style?: React.CSSProperties;
}

export function TodoNodeContent({
  todo,
  depth,
  isExpanded,
  hasChildren,
  leadingSlot,
  className,
  style,
}: TodoNodeContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const toggleExpanded = useTodoUiStore((s) => s.toggleExpanded);
  const setSelectedId = useTodoUiStore((s) => s.setSelectedId);
  const selectedId = useTodoUiStore((s) => s.selectedId);

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const updateMutation = useUpdateTodo();

  const toggleMutate = toggleMutation.mutate;
  const deleteMutate = deleteMutation.mutate;
  const updateMutate = updateMutation.mutate;

  const isSelected = selectedId === todo.id;
  const isCompleted = todo.isCompleted;

  const handleToggle = useCallback(() => {
    toggleMutate({ id: todo.id, isCompleted: !todo.isCompleted });
  }, [toggleMutate, todo.id, todo.isCompleted]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deleteMutate(todo.id);
    setShowDeleteConfirm(false);
  }, [deleteMutate, todo.id]);

  const handleTitleSave = useCallback(
    (title: string) => {
      updateMutate({ id: todo.id, input: { title } });
      setIsEditing(false);
    },
    [updateMutate, todo.id]
  );

  const handleSelect = useCallback(() => {
    setSelectedId(isSelected ? null : todo.id);
  }, [setSelectedId, isSelected, todo.id]);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded(todo.id);
  }, [toggleExpanded, todo.id]);

  const indentPx = depth * 24;

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md',
          'hover:bg-gray-50 transition-colors',
          isSelected && 'bg-blue-50 hover:bg-blue-100',
          isCompleted && 'opacity-60',
          className
        )}
        style={{ paddingLeft: `${indentPx + 8}px`, ...style }}
        onClick={handleSelect}
      >
        {leadingSlot}

        <TodoExpandButton
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={handleExpandToggle}
        />

        <TodoCheckbox
          checked={isCompleted}
          onChange={handleToggle}
          disabled={toggleMutation.isPending}
        />

        {isEditing ? (
          <TodoInlineEdit
            initialValue={todo.title}
            onSave={handleTitleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <span
            className={cn(
              'flex-1 text-sm',
              isCompleted && 'line-through text-gray-500'
            )}
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.title}
          </span>
        )}

        {todo.description != null && (
          <svg
            className="w-3.5 h-3.5 text-gray-300 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="10" y2="12" />
          </svg>
        )}

        {todo.childCount > 0 && (
          <span
            className={cn(
              'text-xs tabular-nums',
              todo.completedChildCount === todo.childCount
                ? 'text-green-600'
                : 'text-gray-400'
            )}
            title={`${todo.completedChildCount} of ${todo.childCount} subtasks completed`}
          >
            {todo.completedChildCount}/{todo.childCount}
          </span>
        )}

        <TodoActions
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {isSelected && <TodoDetailPanel todo={todo} indentPx={indentPx} />}

      {showDeleteConfirm && (
        <ConfirmationDialog
          isOpen
          title="Delete Task"
          message="Are you sure you want to delete this task and all subtasks?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
