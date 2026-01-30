import { cn } from '@lib/utils/cn';

interface TodoActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TodoActions({ onEdit, onDelete, isDeleting }: TodoActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={cn(
          'p-1 text-gray-400 hover:text-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-primary rounded'
        )}
        aria-label="Edit task"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isDeleting}
        className={cn(
          'p-1 text-gray-400 hover:text-red-600',
          'focus:outline-none focus:ring-2 focus:ring-red-500 rounded',
          isDeleting && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Delete task"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1m-8 1h12M6 14h4a1 1 0 001-1V5H5v8a1 1 0 001 1z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
