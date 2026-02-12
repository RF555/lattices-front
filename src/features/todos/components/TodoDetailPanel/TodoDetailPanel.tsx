import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { useIsMobile } from '@hooks/useIsMobile';
import { TodoBreadcrumb } from '../TodoBreadcrumb';
import { useUpdateTodo } from '@features/todos/hooks/useTodos';
import { TagPicker } from '@features/tags/components/TagPicker';
import { useAddTagToTodo, useRemoveTagFromTodo } from '@features/tags/hooks/useTags';
import { ParentPicker } from '../ParentPicker';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import { formatDate, formatDateFull } from '@lib/utils/formatDate';
import type { Todo } from '@features/todos/types/todo';

interface TodoDetailPanelProps {
  todo: Todo;
  indentPx: number;
}

export function TodoDetailPanel({ todo, indentPx }: TodoDetailPanelProps) {
  const { t } = useTranslation('todos');
  const isMobile = useIsMobile();
  const [description, setDescription] = useState(todo.description ?? '');
  const [localTagIds, setLocalTagIds] = useState<string[]>(todo.tags.map((t) => t.id));
  const [localParentId, setLocalParentId] = useState<string | null>(todo.parentId);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDetailEditing = useTodoUiStore((s) => s.isDetailEditing);
  const setDetailEditing = useTodoUiStore((s) => s.setDetailEditing);

  const activeWorkspaceId = useActiveWorkspaceId();
  const updateMutation = useUpdateTodo();
  const updateMutate = updateMutation.mutate;
  const addTagMutation = useAddTagToTodo();
  const removeTagMutation = useRemoveTagFromTodo();

  // Sync from server when not in edit mode
  useEffect(() => {
    if (!isDetailEditing) {
      setDescription(todo.description ?? '');
      setLocalTagIds(todo.tags.map((t) => t.id));
      setLocalParentId(todo.parentId);
    }
  }, [todo.description, todo.tags, todo.parentId, isDetailEditing]);

  // Reset state when switching todos
  useEffect(() => {
    setIsDirty(false);
    setLocalTagIds(todo.tags.map((t) => t.id));
    setLocalParentId(todo.parentId);
  }, [todo.id, todo.tags, todo.parentId]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isDetailEditing) {
      textareaRef.current?.focus();
    }
  }, [isDetailEditing]);

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
    const serverTagIds = new Set(todo.tags.map((t) => t.id));
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
    setDetailEditing(false);
  }, [
    updateMutate,
    todo,
    description,
    localParentId,
    localTagIds,
    addTagMutation,
    removeTagMutation,
    setDetailEditing,
  ]);

  const handleCloseEdit = useCallback(() => {
    setDescription(todo.description ?? '');
    setLocalTagIds(todo.tags.map((t) => t.id));
    setLocalParentId(todo.parentId);
    setIsDirty(false);
    setDetailEditing(false);
  }, [todo.description, todo.tags, todo.parentId, setDetailEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();

      if (e.key === 'Escape') {
        handleCloseEdit();
        return;
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCloseEdit, handleSave],
  );

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click handler only stops event propagation to parent row
    <div
      className="border-t border-gray-100 bg-gray-50/50 shadow-panel animate-in slide-in-from-top-1 fade-in duration-200"
      style={{ paddingInlineStart: `${(isMobile ? Math.min(indentPx, 80) : indentPx) + 8}px` }}
      onClick={handleContainerClick}
    >
      <div className="py-3 pe-3 sm:pe-4 space-y-3">
        {isDetailEditing ? (
          /* ───── Edit Mode ───── */
          <>
            {/* Header: breadcrumb + close button */}
            <div className="flex items-center justify-between gap-2">
              <TodoBreadcrumb todoId={todo.id} />
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                aria-label={t('detail.closeEdit')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
            <Textarea
              ref={textareaRef}
              value={description}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={t('detail.descriptionPlaceholder')}
              className="text-sm bg-white"
              rows={3}
            />

            {/* Tags section */}
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
                workspaceId={todo.workspaceId}
              />
            </div>

            {/* Save/Cancel buttons */}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                {t('actions.save', { ns: 'common' })}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCloseEdit}>
                {t('actions.cancel', { ns: 'common' })}
              </Button>
            </div>
          </>
        ) : (
          /* ───── View Mode ───── */
          <>
            {/* Header: breadcrumb (if has parent) + edit button */}
            <div className="flex items-center justify-between gap-2">
              {todo.parentId !== null && <TodoBreadcrumb todoId={todo.id} />}
              <button
                type="button"
                onClick={() => {
                  setDetailEditing(true);
                }}
                className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors shrink-0 ms-auto"
                aria-label={t('detail.editMode')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Description (read-only) */}
            <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[1.25rem]">
              {todo.description ?? (
                <span className="text-gray-400 italic">{t('detail.noDescription')}</span>
              )}
            </p>
          </>
        )}

        {/* Timestamps section (always visible) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-400">
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
    </div>
  );
}
