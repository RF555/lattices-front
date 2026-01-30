import { useState } from 'react';
import { useCreateTodo } from '../../hooks/useTodos';
import { useSelectedTodoId } from '../../stores/todoUiStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export function CreateTodoForm() {
  const [title, setTitle] = useState('');

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
        parentId: safeParentId,
      });
      setTitle('');
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

      {selectedId && (
        <p className="text-xs text-gray-500">
          Adding as subtask to selected item
        </p>
      )}
    </form>
  );
}
