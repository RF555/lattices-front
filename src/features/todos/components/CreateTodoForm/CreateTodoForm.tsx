import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTodo } from '@features/todos/hooks/useTodos';
import { useSelectedTodoId } from '@features/todos/stores/todoUiStore';
import { useAddTagToTodo } from '@features/tags/hooks/useTags';
import { TagPicker } from '@features/tags/components/TagPicker';
import { ParentPicker } from '../ParentPicker';
import {
  useActiveWorkspaceId,
  useIsAllWorkspaces,
} from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Tooltip } from '@components/ui/Tooltip';

export function CreateTodoForm() {
  const { t } = useTranslation('todos');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

  const activeWorkspaceId = useActiveWorkspaceId();
  const isAllWorkspaces = useIsAllWorkspaces();
  const { data: workspaces = [] } = useWorkspaces();

  // In "All Workspaces" mode, use the workspace selected in the form; otherwise use the active workspace
  const effectiveWorkspaceId = isAllWorkspaces
    ? selectedWorkspaceId || undefined
    : (activeWorkspaceId ?? undefined);
  const createMutation = useCreateTodo(effectiveWorkspaceId);
  const addTagMutation = useAddTagToTodo();
  const selectedId = useSelectedTodoId();

  // Sync parent picker when selectedId changes (user clicks a todo in the tree)
  useEffect(() => {
    const safeSelectedId = selectedId && !selectedId.startsWith('temp-') ? selectedId : null;
    setParentId(safeSelectedId);
    setShowParent(false);
  }, [selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (isAllWorkspaces && !selectedWorkspaceId) return;

    try {
      const effectiveParentId = parentId ?? undefined;

      const newTodo = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: effectiveParentId,
      });

      // Attach selected tags (fire-and-forget; query invalidation handles refresh)
      for (const tagId of selectedTagIds) {
        addTagMutation.mutate({ todoId: newTodo.id, tagId });
      }

      setTitle('');
      setDescription('');
      setShowDescription(false);
      setSelectedTagIds([]);
      setShowTags(false);
      setParentId(null);
      setShowParent(false);
    } catch {
      // Error handled by TanStack Query
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleToggleDescription = () => {
    if (showDescription) {
      setDescription('');
      setShowDescription(false);
    } else {
      setShowDescription(true);
    }
  };

  const handleToggleTags = () => {
    if (showTags) {
      setSelectedTagIds([]);
      setShowTags(false);
    } else {
      setShowTags(true);
    }
  };

  const handleToggleParent = () => {
    if (showParent) {
      setParentId(null);
      setShowParent(false);
    } else {
      setShowParent(true);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="space-y-3"
    >
      {isAllWorkspaces && (
        <select
          value={selectedWorkspaceId}
          onChange={(e) => {
            setSelectedWorkspaceId(e.target.value);
          }}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          <option value="">{t('createForm.selectWorkspace')}</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            parentId ? t('createForm.placeholderSubtask') : t('createForm.placeholderTask')
          }
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!title.trim() || (isAllWorkspaces && !selectedWorkspaceId)}
          tooltip={
            isAllWorkspaces && !selectedWorkspaceId
              ? t('createForm.noWorkspaceSelected')
              : !title.trim()
                ? t('createForm.enterTitle')
                : undefined
          }
        >
          {t('createForm.add')}
        </Button>
      </div>

      {showDescription && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            placeholder={t('createForm.descriptionPlaceholder')}
            className="text-sm"
            rows={2}
          />
          <Tooltip content={t('tooltips.removeDescription')}>
            <button
              type="button"
              onClick={handleToggleDescription}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeDescription')}
            </button>
          </Tooltip>
        </div>
      )}

      {showTags && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <TagPicker
            selectedIds={selectedTagIds}
            onSelect={(tagId) => {
              setSelectedTagIds((prev) => [...prev, tagId]);
            }}
            onDeselect={(tagId) => {
              setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
            }}
            workspaceId={effectiveWorkspaceId}
          />
          <Tooltip content={t('tooltips.removeTags')}>
            <button
              type="button"
              onClick={handleToggleTags}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeTags')}
            </button>
          </Tooltip>
        </div>
      )}

      {showParent && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <ParentPicker
            todoId="__new__"
            currentParentId={parentId}
            workspaceId={effectiveWorkspaceId}
            onParentChange={setParentId}
          />
          <Tooltip content={t('tooltips.removeParent')}>
            <button
              type="button"
              onClick={handleToggleParent}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeParent')}
            </button>
          </Tooltip>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!showDescription && (
          <button
            type="button"
            onClick={handleToggleDescription}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addDescription')}
          </button>
        )}

        {!showTags && (
          <button
            type="button"
            onClick={handleToggleTags}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addTags')}
          </button>
        )}

        {!showParent && parentId && (
          <button
            type="button"
            onClick={handleToggleParent}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-1"
          >
            {t('createForm.subtaskInfo')}
          </button>
        )}

        {!showParent && !parentId && (
          <button
            type="button"
            onClick={handleToggleParent}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addParent')}
          </button>
        )}
      </div>
    </form>
  );
}
