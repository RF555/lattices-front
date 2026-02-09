import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { NotificationItem } from '../components/NotificationItem/NotificationItem';

export default function NotificationsPage() {
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
  } = useNotificationActions();

  return (
    <div className="-mx-4 max-w-4xl sm:mx-auto sm:py-6 sm:px-4">
      {/* Desktop header -- hidden on mobile (bottom nav already shows active tab) */}
      <div className="hidden sm:flex mb-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
          <Check className="h-3.5 w-3.5 me-1" />
          {t('markAllRead')}
        </Button>
      </div>

      {/* Desktop: card wrapper; Mobile: full-bleed */}
      <div className="bg-white sm:rounded-lg sm:shadow-md sm:border sm:border-gray-100">
        {/* Filter tabs + mobile mark-all-read */}
        <div className="sticky top-0 z-sticky bg-white border-b border-gray-100 sm:static sm:z-auto">
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => {
                setPanelFilter('all');
              }}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
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
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                panelFilter === 'unread'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t('filterUnread')}
            </button>
            {/* Mark all read -- mobile only (desktop has it in the header) */}
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="sm:hidden flex items-center gap-1 px-3 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
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
            <div className="border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full text-center text-sm font-medium text-primary hover:text-primary/80"
              >
                {t('loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
