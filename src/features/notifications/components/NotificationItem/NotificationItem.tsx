import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { formatRelativeTime } from '@features/workspaces/utils/activityFormatter';
import {
  formatNotificationMessage,
  getActorInitials,
} from '@features/notifications/utils/formatNotification';
import type { Notification } from '@features/notifications/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onRead: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const { t } = useTranslation('notifications');
  const { t: tCommon } = useTranslation('common');
  const avatarUrl = notification.metadata.actorAvatarUrl;
  const initials = getActorInitials(notification);
  const message = formatNotificationMessage(notification, t as never);

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification);
    }
    onClick(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex w-full gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
        'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
        !notification.isRead && 'bg-blue-50/50',
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Unread indicator */}
      <div className="shrink-0 pt-2 w-2">
        {!notification.isRead && <div className="h-2 w-2 rounded-full bg-blue-500" />}
      </div>

      {/* Avatar */}
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
          {initials}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 line-clamp-2">{message}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatRelativeTime(notification.createdAt, tCommon)}
        </p>
      </div>

      {/* Dismiss button (visible on hover) */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          'shrink-0 rounded p-1 text-gray-400 transition-opacity',
          'hover:bg-gray-200 hover:text-gray-600',
          'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100',
        )}
        aria-label={t('dismiss')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
