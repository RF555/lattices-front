import { useLocation, useNavigate } from 'react-router';
import { LayoutList, FolderOpen, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useUnreadCount } from '@features/notifications/hooks/useNotifications';
import { useMobileNavStore } from '@stores/mobileNavStore';
import { MAX_BADGE_COUNT } from '@features/notifications/constants';

interface NavTab {
  id: string;
  labelKey: string;
  icon: typeof LayoutList;
  action: () => void;
  isActive: boolean;
  badge?: number;
}

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCount();
  const settingsSheetOpen = useMobileNavStore((s) => s.settingsSheetOpen);
  const setSettingsSheetOpen = useMobileNavStore((s) => s.setSettingsSheetOpen);
  const workspaceSwitcherOpen = useMobileNavStore((s) => s.workspaceSwitcherOpen);
  const setWorkspaceSwitcherOpen = useMobileNavStore((s) => s.setWorkspaceSwitcherOpen);

  const isTasksActive = location.pathname === '/app' || location.pathname.startsWith('/app/todos');
  const isNotificationsActive = location.pathname === '/app/notifications';

  /** Close all overlays/sheets */
  const closeOverlays = () => {
    setSettingsSheetOpen(false);
    setWorkspaceSwitcherOpen(false);
  };

  const tabs: NavTab[] = [
    {
      id: 'tasks',
      labelKey: 'nav.tasks',
      icon: LayoutList,
      action: () => {
        closeOverlays();
        void navigate('/app');
      },
      isActive: isTasksActive && !settingsSheetOpen && !workspaceSwitcherOpen,
    },
    {
      id: 'workspaces',
      labelKey: 'nav.workspaces',
      icon: FolderOpen,
      action: () => {
        setSettingsSheetOpen(false);
        setWorkspaceSwitcherOpen(!workspaceSwitcherOpen);
      },
      isActive: workspaceSwitcherOpen,
    },
    {
      id: 'notifications',
      labelKey: 'nav.notifications',
      icon: Bell,
      action: () => {
        closeOverlays();
        void navigate('/app/notifications');
      },
      isActive: isNotificationsActive && !settingsSheetOpen && !workspaceSwitcherOpen,
      badge: unreadCount,
    },
    {
      id: 'more',
      labelKey: 'nav.more',
      icon: Settings,
      action: () => {
        setWorkspaceSwitcherOpen(false);
        setSettingsSheetOpen(!settingsSheetOpen);
      },
      isActive: settingsSheetOpen,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-sticky sm:hidden bg-white border-t border-gray-200 pb-safe"
      aria-label={t('nav.tasks')}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.action}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px]',
                'text-xs font-medium transition-colors',
                tab.isActive ? 'text-primary' : 'text-gray-500',
              )}
              aria-current={tab.isActive ? 'page' : undefined}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -end-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                    {tab.badge > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : tab.badge}
                  </span>
                )}
              </span>
              <span>{t(tab.labelKey as 'nav.tasks')}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
