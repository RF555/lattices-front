import { type ReactNode, useState, useCallback } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@lib/utils/cn';

export interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  enabled?: boolean;
  children: ReactNode;
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delayDuration,
  enabled = true,
  children,
}: TooltipProps) {
  // Always use controlled `open` state so toggling `enabled` doesn't
  // switch between controlled/uncontrolled (avoids React warning).
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(enabled && next);
    },
    [enabled],
  );

  // No content — skip Radix wrapper entirely (content is typically static)
  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root
      delayDuration={delayDuration}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      {open && (
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-toast bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg',
              'select-none text-start max-w-xs',
              'animate-in fade-in slide-in-from-bottom-1 duration-150',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100',
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900" width={8} height={4} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </TooltipPrimitive.Root>
  );
}
