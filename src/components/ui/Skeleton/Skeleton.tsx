import { cn } from '@lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantStyles = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-md',
};

const animationStyles = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer',
  none: '',
};

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{ width, height }}
    />
  );
}
