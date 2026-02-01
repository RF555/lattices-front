import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';

interface TodoExpandButtonProps {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TodoExpandButton({
  hasChildren,
  isExpanded,
  onToggle,
}: TodoExpandButtonProps) {
  const { t } = useTranslation('todos');

  if (!hasChildren) {
    return <div className="w-5 sm:w-4" />;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center',
        'text-gray-400 hover:text-gray-600',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded'
      )}
      aria-label={isExpanded ? t('actions.collapse') : t('actions.expand')}
    >
      <ChevronRight
        className={cn(
          'w-3 h-3 transition-transform rtl:-scale-x-100',
          isExpanded && 'rotate-90'
        )}
      />
    </button>
  );
}
