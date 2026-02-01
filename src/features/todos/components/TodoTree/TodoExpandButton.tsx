import { ChevronRight } from 'lucide-react';
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
  if (!hasChildren) {
    return <div className="w-4" />;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'w-4 h-4 flex items-center justify-center',
        'text-gray-400 hover:text-gray-600',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded'
      )}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      <ChevronRight
        className={cn(
          'w-3 h-3 transition-transform',
          isExpanded && 'rotate-90'
        )}
      />
    </button>
  );
}
