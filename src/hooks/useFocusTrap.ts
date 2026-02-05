import { useEffect, useRef, type RefObject } from 'react';

export function useFocusTrap<T extends HTMLElement>(isActive: boolean): RefObject<T | null> {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- may be undefined if NodeList is empty

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- may be undefined if NodeList is empty
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- may be undefined if NodeList is empty
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}
