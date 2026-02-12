import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/ui/BottomSheet';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { TagPicker } from '@features/tags/components/TagPicker';
import { ParentPicker } from '../ParentPicker';
import { useCreateTodo } from '@features/todos/hooks/useTodos';
import { useSelectedTodoId } from '@features/todos/stores/todoUiStore';
import { useAddTagToTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const { t } = useTranslation('todos');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: workspaces = [] } = useWorkspaces();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(activeWorkspaceId ?? '');

  const selectedId = useSelectedTodoId();

  // Sync workspace and parent selection each time the sheet opens
  useEffect(() => {
    if (open) {
      setSelectedWorkspaceId(activeWorkspaceId ?? '');

      // Pre-populate parent from currently selected todo (if valid)
      const safeSelectedId = selectedId && !selectedId.startsWith('temp-') ? selectedId : null;
      setParentId(safeSelectedId);
      setShowParent(safeSelectedId !== null);
    }
  }, [open, activeWorkspaceId, selectedId]);

  const effectiveWorkspaceId = selectedWorkspaceId || undefined;
  const createMutation = useCreateTodo(effectiveWorkspaceId);
  const addTagMutation = useAddTagToTodo();

  const canSubmit = title.trim() && selectedWorkspaceId;

  const hasParent = showParent && parentId;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setShowDescription(false);
    setSelectedTagIds([]);
    setShowTags(false);
    setParentId(null);
    setShowParent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const effectiveParentId = showParent && parentId ? parentId : undefined;

      const newTodo = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: effectiveParentId,
      });

      for (const tagId of selectedTagIds) {
        addTagMutation.mutate({ todoId: newTodo.id, tagId });
      }

      resetForm();
      onOpenChange(false);
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

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
      title={t('createForm.add')}
    >
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="px-4 pb-4 space-y-3"
      >
        {/* Workspace selector */}
        <select
          value={selectedWorkspaceId}
          onChange={(e) => {
            setSelectedWorkspaceId(e.target.value);
          }}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 min-h-[44px]"
        >
          <option value="">{t('createForm.selectWorkspace')}</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>

        {/* Title input */}
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            hasParent ? t('createForm.placeholderSubtask') : t('createForm.placeholderTask')
          }
        />

        {/* Description toggle + textarea */}
        {showDescription ? (
          <div className="space-y-1">
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder={t('createForm.descriptionPlaceholder')}
              className="text-sm"
              rows={3}
            />
            <button
              type="button"
              onClick={() => {
                setDescription('');
                setShowDescription(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeDescription')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowDescription(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addDescription')}
          </button>
        )}

        {/* Tags toggle + TagPicker */}
        {showTags ? (
          <div className="space-y-1">
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
            <button
              type="button"
              onClick={() => {
                setSelectedTagIds([]);
                setShowTags(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeTags')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowTags(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addTags')}
          </button>
        )}

        {/* Parent toggle + ParentPicker */}
        {showParent ? (
          <div className="space-y-1">
            <ParentPicker
              todoId="__new__"
              currentParentId={parentId}
              workspaceId={effectiveWorkspaceId}
              onParentChange={(newParentId) => {
                setParentId(newParentId);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setParentId(null);
                setShowParent(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('createForm.removeParent')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowParent(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {t('createForm.addParent')}
          </button>
        )}

        {/* Submit button */}
        <Button type="submit" className="w-full min-h-[44px]" disabled={!canSubmit}>
          {t('createForm.add')}
        </Button>
      </form>
    </BottomSheet>
  );
}
