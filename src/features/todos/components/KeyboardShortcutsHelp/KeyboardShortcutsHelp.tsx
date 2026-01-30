import { useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { cn } from '@lib/utils/cn';

const shortcuts = [
  { keys: ['\u2191', 'k'], description: 'Move up' },
  { keys: ['\u2193', 'j'], description: 'Move down' },
  { keys: ['\u2192', 'l'], description: 'Expand item' },
  { keys: ['\u2190', 'h'], description: 'Collapse item / go to parent' },
  { keys: ['Enter', 'Space'], description: 'Toggle complete' },
  { keys: ['\u2318', 'Backspace'], description: 'Delete item' },
  { keys: ['\u2318', 'n'], description: 'New task' },
  { keys: ['Escape'], description: 'Deselect' },
  { keys: ['Home'], description: 'Go to first' },
  { keys: ['End'], description: 'Go to last' },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-700"
        aria-label="Show keyboard shortcuts"
      >
        Keyboard shortcuts (?)
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        className="max-w-sm"
      >
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-gray-600">{description}</span>
              <div className="flex gap-1">
                {keys.map((key, i) => (
                  <span key={i}>
                    <kbd
                      className={cn(
                        'inline-flex items-center justify-center',
                        'min-w-[24px] px-1.5 py-0.5',
                        'bg-gray-100 border border-gray-300 rounded',
                        'text-xs font-mono'
                      )}
                    >
                      {key}
                    </kbd>
                    {i < keys.length - 1 && (
                      <span className="mx-0.5 text-gray-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
        >
          Close
        </button>
      </Modal>
    </>
  );
}
