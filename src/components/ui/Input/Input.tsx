import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
          'text-base sm:text-sm',
          'focus:border-primary focus:ring-primary focus:outline-none focus:ring-1',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
