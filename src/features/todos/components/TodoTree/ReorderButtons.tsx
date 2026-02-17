import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { Tooltip } from '@components/ui/Tooltip';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';

interface ReorderButtonsProps {
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ReorderButtons({ isFirst, isLast, onMoveUp, onMoveDown }: ReorderButtonsProps) {
  const { t } = useTranslation('todos');
  const sortBy = useTodoUiStore((s) => s.sortBy);

  if (sortBy !== 'position') {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <Tooltip content={t('tooltips.moveUp')}>
        <button
          type="button"
          disabled={isFirst}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          className={cn(
            'p-2.5 sm:p-1 text-gray-400 hover:text-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-primary rounded',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400',
          )}
          aria-label={t('actions.moveUp')}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </Tooltip>

      <Tooltip content={t('tooltips.moveDown')}>
        <button
          type="button"
          disabled={isLast}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          className={cn(
            'p-2.5 sm:p-1 text-gray-400 hover:text-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-primary rounded',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400',
          )}
          aria-label={t('actions.moveDown')}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}
