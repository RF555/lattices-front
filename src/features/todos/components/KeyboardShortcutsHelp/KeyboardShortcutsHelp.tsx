import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@components/ui/Modal';
import { cn } from '@lib/utils/cn';

export function KeyboardShortcutsHelp() {
  const { t } = useTranslation('todos');
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['\u2191', 'k'], description: t('shortcuts.moveUp') },
    { keys: ['\u2193', 'j'], description: t('shortcuts.moveDown') },
    { keys: ['\u2192', 'l'], description: t('shortcuts.expandItem') },
    { keys: ['\u2190', 'h'], description: t('shortcuts.collapseItem') },
    { keys: ['Enter', 'Space'], description: t('shortcuts.toggleComplete') },
    { keys: ['\u2318', 'Backspace'], description: t('shortcuts.deleteItem') },
    { keys: ['\u2318', 'n'], description: t('shortcuts.newTask') },
    { keys: ['Escape'], description: t('shortcuts.deselect') },
    { keys: ['Home'], description: t('shortcuts.goToFirst') },
    { keys: ['End'], description: t('shortcuts.goToLast') },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
        className="text-xs text-gray-500 hover:text-gray-700"
        aria-label={t('shortcuts.triggerAriaLabel')}
      >
        {t('shortcuts.trigger')}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title={t('shortcuts.title')}
        className="max-w-sm"
      >
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{description}</span>
              <div className="flex gap-1">
                {keys.map((key, i) => (
                  <span key={i}>
                    <kbd
                      className={cn(
                        'inline-flex items-center justify-center',
                        'min-w-[24px] px-1.5 py-0.5',
                        'bg-gray-100 border border-gray-300 rounded',
                        'text-xs font-mono',
                      )}
                    >
                      {key}
                    </kbd>
                    {i < keys.length - 1 && <span className="mx-0.5 text-gray-400">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
          }}
          className="mt-6 w-full py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
        >
          {t('actions.close', { ns: 'common' })}
        </button>
      </Modal>
    </>
  );
}
