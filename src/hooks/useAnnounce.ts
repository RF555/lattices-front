import { useCallback, useRef, useEffect } from 'react';

export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
    announcer.style.clipPath = 'inset(50%)';
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      document.body.removeChild(announcer);
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      // Clear and set to trigger announcement
      announcerRef.current.textContent = '';
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 50);
    }
  }, []);

  return announce;
}
