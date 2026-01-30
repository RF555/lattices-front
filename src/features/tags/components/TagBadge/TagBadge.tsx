import { cn } from '@lib/utils/cn';

interface TagBadgeProps {
  tag: { name: string; colorHex: string };
  size?: 'sm' | 'md';
  onRemove?: () => void;
  onClick?: () => void;
}

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
};

export function TagBadge({
  tag,
  size = 'sm',
  onRemove,
  onClick,
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'font-medium',
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      style={{
        backgroundColor: `${tag.colorHex}20`,
        color: tag.colorHex,
      }}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5"
          aria-label={`Remove ${tag.name} tag`}
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
