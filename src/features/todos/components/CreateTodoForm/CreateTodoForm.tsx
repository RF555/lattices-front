import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTodo } from '../../hooks/useTodos';
import { useSelectedTodoId } from '../../stores/todoUiStore';
import { useAddTagToTodo } from '@features/tags/hooks/useTags';
import { TagPicker } from '@features/tags/components/TagPicker';
import { useActiveWorkspaceId, useIsAllWorkspaces } from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';

export function CreateTodoForm() {
  const { t } = useTranslation('todos');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

  const activeWorkspaceId = useActiveWorkspaceId();
  const isAllWorkspaces = useIsAllWorkspaces();
  const { data: workspaces = [] } = useWorkspaces();

  // In "All Workspaces" mode, use the workspace selected in the form; otherwise use the active workspace
  const effectiveWorkspaceId = isAllWorkspaces ? (selectedWorkspaceId || undefined) : (activeWorkspaceId ?? undefined);
  const createMutation = useCreateTodo(effectiveWorkspaceId);
  const addTagMutation = useAddTagToTodo();
  const selectedId = useSelectedTodoId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (isAllWorkspaces && !selectedWorkspaceId) return;

    try {
      // Fix M8: Guard against temp IDs leaking into parentId
      const safeParentId = selectedId && !selectedId.startsWith('temp-') ? selectedId : undefined;

      const newTodo = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: safeParentId,
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
    } catch {
      // Error handled by TanStack Query
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isAllWorkspaces && (
        <select
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          <option value="">{t('createForm.selectWorkspace')}</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedId ? t('createForm.placeholderSubtask') : t('createForm.placeholderTask')}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!title.trim() || createMutation.isPending || (isAllWorkspaces && !selectedWorkspaceId)}
          isLoading={createMutation.isPending}
        >
          {t('createForm.add')}
        </Button>
      </div>

      {showDescription && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('createForm.descriptionPlaceholder')}
            className="text-sm"
            rows={2}
          />
          <button
            type="button"
            onClick={handleToggleDescription}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('createForm.removeDescription')}
          </button>
        </div>
      )}

      {showTags && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <TagPicker
            selectedIds={selectedTagIds}
            onSelect={(tagId) => setSelectedTagIds((prev) => [...prev, tagId])}
            onDeselect={(tagId) => setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))}
            workspaceId={effectiveWorkspaceId}
          />
          <button
            type="button"
            onClick={handleToggleTags}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('createForm.removeTags')}
          </button>
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

        {selectedId && (
          <p className="text-xs text-gray-500">
            {t('createForm.subtaskInfo')}
          </p>
        )}
      </div>
    </form>
  );
}
