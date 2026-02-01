import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm',
          'focus:border-primary focus:ring-primary focus:outline-none focus:ring-1 sm:text-sm',
          'disabled:bg-gray-50 disabled:text-gray-500',
          'resize-y min-h-[60px]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
