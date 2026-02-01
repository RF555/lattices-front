import { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { useUpdateTodo } from '../../hooks/useTodos';
import { formatDate, formatDateFull } from '@lib/utils/formatDate';
import type { Todo } from '../../types/todo';

interface TodoDetailPanelProps {
  todo: Todo;
  indentPx: number;
}

export function TodoDetailPanel({ todo, indentPx }: TodoDetailPanelProps) {
  const [description, setDescription] = useState(todo.description ?? '');
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateMutation = useUpdateTodo();
  const updateMutate = updateMutation.mutate;

  // Sync from server when not dirty
  useEffect(() => {
    if (!isDirty) {
      setDescription(todo.description ?? '');
    }
  }, [todo.description, isDirty]);

  const handleSave = useCallback(() => {
    const trimmed = description.trim();
    const value = trimmed || null;
    updateMutate({ id: todo.id, input: { description: value } });
    setIsDirty(false);
  }, [updateMutate, todo.id, description]);

  const handleCancel = useCallback(() => {
    setDescription(todo.description ?? '');
    setIsDirty(false);
    textareaRef.current?.blur();
  }, [todo.description]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Don't auto-save on blur for textareas to prevent accidental data loss.
    // Users must explicitly save via button or Ctrl+Enter.
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
    [handleCancel, handleSave]
  );

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-1 fade-in duration-200"
      style={{ paddingLeft: `${indentPx + 8}px` }}
      onClick={handleContainerClick}
    >
      <div className="py-3 pr-4 space-y-3">
        {/* Description section */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={description}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add a description..."
            className="text-sm bg-white"
            rows={3}
          />

          {isDirty && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Timestamps section */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span title={formatDateFull(todo.createdAt)}>
            Created {formatDate(todo.createdAt)}
          </span>
          <span title={formatDateFull(todo.updatedAt)}>
            Updated {formatDate(todo.updatedAt)}
          </span>
          {todo.completedAt && (
            <span title={formatDateFull(todo.completedAt)}>
              Completed {formatDate(todo.completedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
