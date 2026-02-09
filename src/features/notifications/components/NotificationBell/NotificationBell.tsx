import { useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useNotificationUiStore } from '../../stores/notificationUiStore';
import { MAX_BADGE_COUNT } from '../../constants';
import { NotificationPanel } from '../NotificationPanel/NotificationPanel';

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadCount();
  const panelOpen = useNotificationUiStore((s) => s.panelOpen);
  const togglePanel = useNotificationUiStore((s) => s.togglePanel);
  const setPanelOpen = useNotificationUiStore((s) => s.setPanelOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    },
    [setPanelOpen],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false);
        return;
      }

      // Toggle panel with 'N' key when no input/textarea/select is focused
      if (
        e.key === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target as HTMLElement).isContentEditable
      ) {
        togglePanel();
      }
    },
    [panelOpen, setPanelOpen, togglePanel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelOpen, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className={cn(
          'relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'transition-colors',
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <NotificationPanel
          onClose={() => {
            setPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
