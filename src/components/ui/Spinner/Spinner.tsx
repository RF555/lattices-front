import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
      role="status"
      aria-label={t('actions.loading')}
    />
  );
}
