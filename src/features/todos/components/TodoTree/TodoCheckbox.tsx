import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { Tooltip } from '@components/ui/Tooltip';

interface TodoCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function TodoCheckbox({ checked, onChange, disabled }: TodoCheckboxProps) {
  const { t } = useTranslation('todos');

  return (
    <Tooltip content={checked ? t('tooltips.markIncomplete') : t('tooltips.markComplete')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        className={cn(
          'w-5 h-5 sm:w-4 sm:h-4 rounded border flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'transition-colors',
          checked
            ? 'bg-primary border-primary text-white'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {checked && <Check className="w-3 h-3" strokeWidth={2.5} />}
      </button>
    </Tooltip>
  );
}
