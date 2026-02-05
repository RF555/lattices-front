import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { useIsMobile } from '@hooks/useIsMobile';
import { TodoBreadcrumb } from '../TodoBreadcrumb';
import { useUpdateTodo } from '../../hooks/useTodos';
import { TagPicker } from '@features/tags/components/TagPicker';
import { useAddTagToTodo, useRemoveTagFromTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { formatDate, formatDateFull } from '@lib/utils/formatDate';
import type { Todo } from '../../types/todo';

interface TodoDetailPanelProps {
  todo: Todo;
  indentPx: number;
}

export function TodoDetailPanel({ todo, indentPx }: TodoDetailPanelProps) {
  const { t } = useTranslation('todos');
  const isMobile = useIsMobile();
  const [description, setDescription] = useState(todo.description ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeWorkspaceId = useActiveWorkspaceId();
  const updateMutation = useUpdateTodo();
  const updateMutate = updateMutation.mutate;
  const addTagMutation = useAddTagToTodo();
  const removeTagMutation = useRemoveTagFromTodo();

  // Sync from server when not editing
  useEffect(() => {
    if (!isEditing) {
      setDescription(todo.description ?? '');
    }
  }, [todo.description, isEditing]);

  // Reset edit mode when switching todos
  useEffect(() => {
    setIsEditing(false);
    setIsDirty(false);
  }, [todo.id]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = description.trim();
    const value = trimmed || null;
    updateMutate({ id: todo.id, input: { description: value } });
    setIsDirty(false);
    setIsEditing(false);
  }, [updateMutate, todo.id, description]);

  const handleCancel = useCallback(() => {
    setDescription(todo.description ?? '');
    setIsDirty(false);
    setIsEditing(false);
  }, [todo.description]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();

      if (e.key === 'Escape') {
        handleCancel();
        return;
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave],
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
        {/* Breadcrumb */}
        <TodoBreadcrumb todoId={todo.id} />

        {/* Description section */}
        <div className="space-y-2">
          {isEditing ? (
            <>
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={t('detail.descriptionPlaceholder')}
                className="text-sm bg-white"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                  {t('actions.save', { ns: 'common' })}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  {t('actions.cancel', { ns: 'common' })}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 min-h-[1.25rem]">
                {todo.description || (
                  <span className="text-gray-400 italic">{t('detail.noDescription')}</span>
                )}
              </p>
              <button
                type="button"
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                aria-label={t('detail.editDescription')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tags section */}
        <div className="space-y-1">
          <span className="block text-xs font-medium text-gray-500">{t('detail.tags')}</span>
          <TagPicker
            selectedIds={todo.tags.map((t) => t.id)}
            onSelect={(tagId) => {
              addTagMutation.mutate({ todoId: todo.id, tagId });
            }}
            onDeselect={(tagId) => {
              removeTagMutation.mutate({ todoId: todo.id, tagId });
            }}
            workspaceId={activeWorkspaceId ?? undefined}
          />
        </div>

        {/* Timestamps section */}
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
