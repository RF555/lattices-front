import { Plus } from 'lucide-react';
import { cn } from '@lib/utils/cn';

interface FABProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export function FAB({ onClick, label, className }: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed bottom-24 end-4 z-sticky sm:hidden',
        'flex items-center justify-center',
        'w-14 h-14 rounded-full',
        'bg-primary text-white shadow-lg',
        'active:scale-95 transition-transform',
        className,
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
