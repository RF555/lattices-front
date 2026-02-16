import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useNotificationActions } from '@features/notifications/hooks/useNotificationActions';
import { NotificationItem } from '../NotificationItem/NotificationItem';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { t } = useTranslation('notifications');
  const {
    notifications,
    nextCursor,
    isLoading,
    panelFilter,
    setPanelFilter,
    handleMarkAllRead,
    handleRead,
    handleDelete,
    handleClick,
    handleLoadMore,
  } = useNotificationActions({ onNavigate: onClose });

  return (
    <div className="z-notification flex flex-col rounded-lg border border-gray-200 bg-white shadow-lg absolute end-0 top-full mt-2 w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
          <Check className="h-3.5 w-3.5 me-1" />
          {t('markAllRead')}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => {
            setPanelFilter('all');
          }}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            panelFilter === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {t('filterAll')}
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelFilter('unread');
          }}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            panelFilter === 'unread'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {t('filterUnread')}
        </button>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto max-h-[28rem]">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            {panelFilter === 'unread' ? t('allCaughtUp') : t('empty')}
          </p>
        )}

        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={handleRead}
            onDelete={handleDelete}
            onClick={handleClick}
          />
        ))}

        {/* Load more */}
        {nextCursor && (
          <div className="border-t border-gray-100 px-4 py-2">
            <button
              type="button"
              onClick={handleLoadMore}
              className="w-full text-center text-xs font-medium text-primary hover:text-primary/80"
            >
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
