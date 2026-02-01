import { cn } from '@lib/utils/cn';

interface DropIndicatorProps {
  position: 'above' | 'below' | 'child';
  depth: number;
  isActive: boolean;
}

export function DropIndicator({ position, depth, isActive }: DropIndicatorProps) {
  if (!isActive) return null;

  const indentPx = depth * 24;

  if (position === 'child') {
    return (
      <div
        className="absolute inset-0 rounded-md border-2 border-dashed border-primary bg-primary/5 pointer-events-none"
        style={{ marginInlineStart: `${indentPx + 24}px` }}
      />
    );
  }

  return (
    <div
      className={cn(
        'absolute start-0 end-0 h-0.5 bg-primary',
        position === 'above' ? '-top-0.5' : '-bottom-0.5'
      )}
      style={{ marginInlineStart: `${indentPx}px` }}
    >
      <div
        className={cn(
          'absolute w-2 h-2 rounded-full bg-primary',
          '-start-1 -top-[3px]'
        )}
      />
    </div>
  );
}
