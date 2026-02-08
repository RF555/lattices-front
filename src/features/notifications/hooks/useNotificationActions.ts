import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from './useNotifications';
import { useNotificationUiStore } from '../stores/notificationUiStore';
import { getEntityRoute } from '../utils/formatNotification';
import type { Notification } from '../types/notification';

interface UseNotificationActionsOptions {
  /** Called after clicking a notification (e.g. close a panel). */
  onNavigate?: () => void;
}

export function useNotificationActions(options?: UseNotificationActionsOptions) {
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
    options?.onNavigate?.();
    if (notification.entityType === 'todo') {
      useTodoUiStore.getState().setSelectedId(notification.entityId);
    }
    const route = getEntityRoute(notification);
    void navigate(route);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      setCursor(nextCursor);
    }
  };

  return {
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
  };
}
