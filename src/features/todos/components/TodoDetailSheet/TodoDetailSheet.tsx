import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/ui/BottomSheet';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { TagPicker } from '@features/tags/components/TagPicker';
import { TagBadge } from '@features/tags/components/TagBadge';
import { ParentPicker } from '../ParentPicker';
import { TodoBreadcrumb } from '../TodoBreadcrumb';
import { TodoCheckbox } from '../TodoTree/TodoCheckbox';
import { useUpdateTodo, useToggleTodo } from '@features/todos/hooks/useTodos';
import { useAddTagToTodo, useRemoveTagFromTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { formatDate, formatDateFull } from '@lib/utils/formatDate';
import type { Todo } from '@features/todos/types/todo';

interface TodoDetailSheetProps {
  todo: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoDetailSheet({ todo, open, onOpenChange }: TodoDetailSheetProps) {
  const { t } = useTranslation('todos');
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(todo.description ?? '');
  const [localTagIds, setLocalTagIds] = useState<string[]>(todo.tags.map((tag) => tag.id));
  const [localParentId, setLocalParentId] = useState<string | null>(todo.parentId);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeWorkspaceId = useActiveWorkspaceId();
  const updateMutation = useUpdateTodo();
  const updateMutate = updateMutation.mutate;
  const toggleMutation = useToggleTodo();
  const toggleMutate = toggleMutation.mutate;
  const addTagMutation = useAddTagToTodo();
  const removeTagMutation = useRemoveTagFromTodo();

  // Sync from server state when opening or when todo changes
  useEffect(() => {
    if (open) {
      setDescription(todo.description ?? '');
      setLocalTagIds(todo.tags.map((tag) => tag.id));
      setLocalParentId(todo.parentId);
      setIsDirty(false);
      setIsEditing(false);
    }
  }, [open, todo.id, todo.description, todo.tags, todo.parentId]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    // Build update input: description + parentId (only if changed)
    const trimmed = description.trim();
    const descValue = trimmed || null;
    const input: { description: string | null; parentId?: string | null } = {
      description: descValue,
    };
    if (localParentId !== todo.parentId) {
      input.parentId = localParentId;
    }
    updateMutate({ id: todo.id, input });

    // Compute tag diffs and fire mutations
    const serverTagIds = new Set(todo.tags.map((tag) => tag.id));
    const localSet = new Set(localTagIds);
    for (const tagId of localTagIds) {
      if (!serverTagIds.has(tagId)) {
        addTagMutation.mutate({ todoId: todo.id, tagId });
      }
    }
    for (const tagId of serverTagIds) {
      if (!localSet.has(tagId)) {
        removeTagMutation.mutate({ todoId: todo.id, tagId });
      }
    }

    setIsDirty(false);
    setIsEditing(false);
  }, [
    updateMutate,
    todo,
    description,
    localParentId,
    localTagIds,
    addTagMutation,
    removeTagMutation,
  ]);

  const handleCancel = useCallback(() => {
    setDescription(todo.description ?? '');
    setLocalTagIds(todo.tags.map((tag) => tag.id));
    setLocalParentId(todo.parentId);
    setIsDirty(false);
    setIsEditing(false);
  }, [todo.description, todo.tags, todo.parentId]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  const handleToggle = useCallback(() => {
    toggleMutate({ id: todo.id, isCompleted: !todo.isCompleted });
  }, [toggleMutate, todo.id, todo.isCompleted]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset all local state on dismiss
          setDescription(todo.description ?? '');
          setLocalTagIds(todo.tags.map((tag) => tag.id));
          setLocalParentId(todo.parentId);
          setIsDirty(false);
          setIsEditing(false);
        }
        onOpenChange(isOpen);
      }}
      title={todo.title}
    >
      <div className="px-4 pb-4 space-y-4">
        {/* Header: title + checkbox */}
        <div className="flex items-start gap-3">
          <TodoCheckbox checked={todo.isCompleted} onChange={handleToggle} />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 break-words">{todo.title}</h3>
            {todo.parentId !== null && (
              <div className="mt-1">
                <TodoBreadcrumb todoId={todo.id} />
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          /* ───── Edit Mode ───── */
          <>
            {/* Parent section */}
            <div className="space-y-1">
              <span className="block text-xs font-medium text-gray-500">{t('detail.parent')}</span>
              <ParentPicker
                todoId={todo.id}
                currentParentId={localParentId}
                workspaceId={activeWorkspaceId ?? undefined}
                onParentChange={(parentId) => {
                  setLocalParentId(parentId);
                  setIsDirty(true);
                }}
              />
            </div>

            {/* Description section (editable) */}
            <div className="space-y-1">
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={handleDescriptionChange}
                onKeyDown={handleKeyDown}
                placeholder={t('detail.descriptionPlaceholder')}
                className="text-sm bg-white"
                rows={3}
              />
            </div>

            {/* Tags section (editable) */}
            <div className="space-y-1">
              <span className="block text-xs font-medium text-gray-500">{t('detail.tags')}</span>
              <TagPicker
                selectedIds={localTagIds}
                onSelect={(tagId) => {
                  setLocalTagIds((prev) => [...prev, tagId]);
                  setIsDirty(true);
                }}
                onDeselect={(tagId) => {
                  setLocalTagIds((prev) => prev.filter((id) => id !== tagId));
                  setIsDirty(true);
                }}
                workspaceId={activeWorkspaceId ?? undefined}
              />
            </div>

            {/* Save/Cancel buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button className="flex-1 min-h-[44px]" onClick={handleSave} disabled={!isDirty}>
                {t('actions.save', { ns: 'common' })}
              </Button>
              <Button className="flex-1 min-h-[44px]" variant="ghost" onClick={handleCancel}>
                {t('actions.cancel', { ns: 'common' })}
              </Button>
            </div>
          </>
        ) : (
          /* ───── View Mode ───── */
          <>
            {/* Description (read-only) + Edit button */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[1.25rem] flex-1">
                {todo.description ?? (
                  <span className="text-gray-400 italic">{t('detail.noDescription')}</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                }}
                className="p-1.5 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                aria-label={t('detail.editMode')}
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {/* Tags (read-only) */}
            {todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {todo.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Timestamps (always visible) */}
        <div className="flex flex-col gap-1 text-xs text-gray-400">
          <span title={formatDateFull(todo.createdAt)}>
            {t('detail.created', { date: formatDate(todo.createdAt) })}
          </span>
          <span title={formatDateFull(todo.updatedAt)}>
            {t('detail.updated', { date: formatDate(todo.updatedAt) })}
          </span>
          {todo.completedAt && (
            <span title={formatDateFull(todo.completedAt)}>
              {t('detail.completed', { date: formatDate(todo.completedAt) })}
            </span>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
