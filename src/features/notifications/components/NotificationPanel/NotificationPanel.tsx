import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { formatRelativeTime } from '@features/workspaces/utils/activityFormatter';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { t } = useTranslation('notifications');
  const { data: notifications, isLoading } = useNotifications({ limit: 20 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead.mutate(notificationId);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
          <Check className="h-3.5 w-3.5 mr-1" />
          {t('markAllRead')}
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-6">{t('empty')}</p>
        )}

        {notifications?.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={cn(
              'flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
              !notification.isRead && 'bg-blue-50/50'
            )}
            onClick={() => handleNotificationClick(notification.id)}
          >
            {notification.actorAvatarUrl ? (
              <img
                src={notification.actorAvatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                {notification.actorName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatRelativeTime(notification.createdAt, t)}
              </p>
            </div>
            {!notification.isRead && (
              <div className="shrink-0 mt-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
