import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { Tooltip } from '@components/ui/Tooltip';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  tooltip?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      tooltip,
      children,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      ghost: 'hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'text-sm px-3 py-1.5 min-h-[44px] sm:min-h-0',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };

    const isDisabled = disabled ?? isLoading;

    const button = (
      <button
        ref={ref}
        type="button"
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ms-1 me-2 h-4 w-4" />
            {t('actions.loading')}
          </>
        ) : (
          children
        )}
      </button>
    );

    if (!tooltip) {
      return button;
    }

    if (isDisabled) {
      return (
        <Tooltip content={tooltip}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- span needs tabIndex for tooltip on disabled button */}
          <span tabIndex={0} className="inline-flex">
            {button}
          </span>
        </Tooltip>
      );
    }

    return <Tooltip content={tooltip}>{button}</Tooltip>;
  },
);

Button.displayName = 'Button';
