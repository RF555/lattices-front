import { cn } from '@lib/utils/cn';

interface TodoCheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function TodoCheckbox({ checked, onChange, disabled }: TodoCheckboxProps) {
  return (
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
        'w-4 h-4 rounded border flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        'transition-colors',
        checked
          ? 'bg-primary border-primary text-white'
          : 'border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {checked && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
