import { useState, useCallback, type ReactNode } from 'react';
import { AlignLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useIsMobile } from '@hooks/useIsMobile';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { useToggleTodo, useDeleteTodo, useUpdateTodo } from '../../hooks/useTodos';
import { useIsAllWorkspaces } from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { TodoCheckbox } from '../TodoTree/TodoCheckbox';
import { TodoExpandButton } from '../TodoTree/TodoExpandButton';
import { TodoActions } from '../TodoTree/TodoActions';
import { TodoInlineEdit } from '../TodoTree/TodoInlineEdit';
import { TagBadge } from '@features/tags/components/TagBadge';
import { ConfirmationDialog } from '@components/feedback/ConfirmationDialog';
import { TodoDetailPanel } from '../TodoDetailPanel';
import { TodoDetailSheet } from '../TodoDetailSheet';
import { SwipeableTodoRow } from '../SwipeableTodoRow';
import type { Todo } from '../../types/todo';

interface TodoNodeContentProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  /** Optional leading content */
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
  const { t } = useTranslation('todos');
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();
  const toggleExpanded = useTodoUiStore((s) => s.toggleExpanded);
  const setSelectedId = useTodoUiStore((s) => s.setSelectedId);
  const setDetailEditing = useTodoUiStore((s) => s.setDetailEditing);
  const selectedId = useTodoUiStore((s) => s.selectedId);

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const updateMutation = useUpdateTodo();

  const toggleMutate = toggleMutation.mutate;
  const deleteMutate = deleteMutation.mutate;
  const updateMutate = updateMutation.mutate;

  const isAllWorkspaces = useIsAllWorkspaces();
  const { data: workspaces = [] } = useWorkspaces();

  const isSelected = selectedId === todo.id;
  const isCompleted = todo.isCompleted;

  // Workspace badge for root-level todos in "All Workspaces" mode
  const workspaceName =
    isAllWorkspaces && depth === 0 && todo.workspaceId
      ? workspaces.find((w) => w.id === todo.workspaceId)?.name
      : undefined;

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
    [updateMutate, todo.id],
  );

  const handleSelect = useCallback(() => {
    setSelectedId(isSelected ? null : todo.id);
  }, [setSelectedId, isSelected, todo.id]);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded(todo.id);
  }, [toggleExpanded, todo.id]);

  const indentPx = isMobile ? Math.min(depth * 16, 80) : depth * 24;

  return (
    <>
      <SwipeableTodoRow
        todoId={todo.id}
        onDelete={handleDelete}
        onToggleComplete={handleToggle}
        isCompleted={isCompleted}
      >
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'group flex items-center gap-1.5 sm:gap-2 px-2 py-2 sm:py-1.5 rounded-md',
            'hover:bg-gray-50 transition-all',
            depth === 0 ? 'shadow-node hover:shadow-node-hover' : 'shadow-none hover:shadow-node',
            isSelected && 'bg-blue-50 hover:bg-blue-100 shadow-node-selected',
            isCompleted && 'opacity-60',
            className,
          )}
          style={{ paddingInlineStart: `${indentPx + 8}px`, ...style }}
          onClick={handleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect();
            }
          }}
        >
          {leadingSlot}

          <TodoExpandButton
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={handleExpandToggle}
          />

          <TodoCheckbox checked={isCompleted} onChange={handleToggle} />

          {isEditing ? (
            <TodoInlineEdit
              initialValue={todo.title}
              onSave={handleTitleSave}
              onCancel={() => {
                setIsEditing(false);
              }}
            />
          ) : (
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1 justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Workspace badge in All Workspaces mode */}
                {workspaceName && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 shrink-0">
                    {workspaceName}
                  </span>
                )}
                {}
                <span
                  className={cn('text-sm truncate', isCompleted && 'line-through text-gray-500')}
                  onDoubleClick={() => {
                    setIsEditing(true);
                  }}
                >
                  {todo.title}
                </span>
              </div>
              {/* Tag badges (read-only display in tree row) */}
              {todo.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 ms-auto justify-end">
                  {todo.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          )}

          {todo.description != null && (
            <AlignLeft className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden="true" />
          )}

          {todo.childCount > 0 && (
            <span
              className={cn(
                'text-xs tabular-nums',
                todo.completedChildCount === todo.childCount ? 'text-green-600' : 'text-gray-400',
              )}
              title={t('nodeContent.subtaskProgress', {
                completed: todo.completedChildCount,
                total: todo.childCount,
              })}
            >
              {todo.completedChildCount}/{todo.childCount}
            </span>
          )}

          <TodoActions
            onEdit={() => {
              if (!isSelected) {
                setSelectedId(todo.id);
              }
              setDetailEditing(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      </SwipeableTodoRow>

      {isSelected &&
        (isMobile ? (
          <TodoDetailSheet
            todo={todo}
            open={isSelected}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setSelectedId(null);
              }
            }}
          />
        ) : (
          <TodoDetailPanel todo={todo} indentPx={indentPx} />
        ))}

      {showDeleteConfirm && (
        <ConfirmationDialog
          isOpen
          title={t('nodeContent.deleteTitle')}
          message={t('nodeContent.deleteMessage')}
          confirmLabel={t('nodeContent.deleteConfirm')}
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </>
  );
}
