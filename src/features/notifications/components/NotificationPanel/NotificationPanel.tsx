import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import { useNotificationUiStore } from '../../stores/notificationUiStore';
import { getEntityRoute } from '../../utils/formatNotification';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import type { Notification } from '../../types/notification';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const panelFilter = useNotificationUiStore((s) => s.panelFilter);
  const setPanelFilter = useNotificationUiStore((s) => s.setPanelFilter);

  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = useNotifications({
    isRead: panelFilter === 'unread' ? false : undefined,
    limit: 20,
    cursor,
  });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const nextCursor = data?.nextCursor ?? null;

  const handleMarkAllRead = () => {
    markAllAsRead.mutate(undefined);
  };

  const handleRead = (notification: Notification) => {
    markAsRead.mutate({
      workspaceId: notification.workspaceId,
      recipientId: notification.id,
    });
  };

  const handleDelete = (notification: Notification) => {
    deleteNotification.mutate({
      workspaceId: notification.workspaceId,
      recipientId: notification.id,
    });
  };

  const handleClick = (notification: Notification) => {
    // Close panel
    onClose();

    // Select todo in UI if navigating to a task
    if (notification.entityType === 'todo') {
      useTodoUiStore.getState().setSelectedId(notification.entityId);
    }

    // Navigate to entity
    const route = getEntityRoute(notification);
    navigate(route);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      setCursor(nextCursor);
    }
  };

  return (
    <div
      className={cn(
        'z-50 flex flex-col rounded-lg border border-gray-200 bg-white shadow-lg',
        // Mobile: fixed full-screen overlay; sm+: absolute dropdown
        'fixed inset-0 sm:absolute sm:inset-auto sm:end-0 sm:top-full sm:mt-2',
        'w-full sm:w-96'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <Check className="h-3.5 w-3.5 me-1" />
            {t('markAllRead')}
          </Button>
          {/* Close button visible on mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => setPanelFilter('all')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            panelFilter === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t('filterAll')}
        </button>
        <button
          type="button"
          onClick={() => setPanelFilter('unread')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            panelFilter === 'unread'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t('filterUnread')}
        </button>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto sm:max-h-[28rem]">
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
