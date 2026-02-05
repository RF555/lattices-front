import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@lib/utils/cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- generic component; association provided by consumer via htmlFor or nesting
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-gray-700', className)}
      {...props}
    />
  );
});

Label.displayName = 'Label';
