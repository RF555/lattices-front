import { useState } from 'react';
import { useCreateTodo } from '../../hooks/useTodos';
import { useSelectedTodoId } from '../../stores/todoUiStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';

export function CreateTodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  const createMutation = useCreateTodo();
  const selectedId = useSelectedTodoId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      // Fix M8: Guard against temp IDs leaking into parentId
      const safeParentId = selectedId && !selectedId.startsWith('temp-') ? selectedId : undefined;

      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: safeParentId,
      });
      setTitle('');
      setDescription('');
      setShowDescription(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedId ? 'Add subtask...' : 'Add task...'}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!title.trim() || createMutation.isPending}
          isLoading={createMutation.isPending}
        >
          Add
        </Button>
      </div>

      {showDescription && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-150 space-y-1">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)..."
            className="text-sm"
            rows={2}
          />
          <button
            type="button"
            onClick={handleToggleDescription}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Remove description
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!showDescription && (
          <button
            type="button"
            onClick={handleToggleDescription}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            + Add description
          </button>
        )}

        {selectedId && (
          <p className="text-xs text-gray-500">
            Adding as subtask to selected item
          </p>
        )}
      </div>
    </form>
  );
}
