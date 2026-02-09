import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@lib/utils/cn';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Max height CSS class, default 'max-h-[85vh]' */
  maxHeight?: string;
  /** Whether dragging outside the handle can dismiss */
  dismissible?: boolean;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  maxHeight = 'max-h-[85vh]',
  dismissible = true,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-overlay bg-black/40" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 inset-x-0 z-modal',
            'bg-white rounded-t-2xl shadow-lg',
            'flex flex-col',
            maxHeight,
            'pb-safe',
            className,
          )}
          aria-label={title}
        >
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-gray-300" />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
