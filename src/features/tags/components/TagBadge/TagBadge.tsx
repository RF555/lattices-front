import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

export function TagBadge({ tag, size = 'sm', onRemove, onClick }: TagBadgeProps) {
  const { t } = useTranslation('tags');

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'font-medium',
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      style={{
        backgroundColor: `${tag.colorHex}20`,
        color: tag.colorHex,
      }}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ms-0.5 hover:bg-black/10 rounded-full p-0.5"
          aria-label={t('badge.removeTag', { name: tag.name })}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
