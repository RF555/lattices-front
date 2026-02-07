import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';

interface TodoActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function TodoActions({ onEdit, onDelete }: TodoActionsProps) {
  const { t } = useTranslation('todos');

  return (
    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={cn(
          'p-1.5 sm:p-1 text-gray-400 hover:text-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-primary rounded',
        )}
        aria-label={t('actions.editTask')}
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'p-1.5 sm:p-1 text-gray-400 hover:text-red-600',
          'focus:outline-none focus:ring-2 focus:ring-red-500 rounded',
        )}
        aria-label={t('actions.deleteTask')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
