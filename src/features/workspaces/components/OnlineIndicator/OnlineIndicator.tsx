import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import type { PresenceUser } from '@lib/realtime';

interface OnlineIndicatorProps {
  onlineUsers: PresenceUser[];
  className?: string;
}

/**
 * Shows the number of online users with a green dot. Hovering reveals a
 * tooltip with individual user names.
 */
export function OnlineIndicator({ onlineUsers, className }: OnlineIndicatorProps) {
  const { t } = useTranslation('workspaces');

  if (onlineUsers.length === 0) return null;

  return (
    <div className={cn('relative group inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs text-gray-500">
        {t('realtime.onlineCount', { count: onlineUsers.length })}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
          {onlineUsers.slice(0, 10).map((user) => (
            <div key={user.userId} className="flex items-center gap-2 py-0.5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-medium">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span>{user.displayName}</span>
            </div>
          ))}
          {onlineUsers.length > 10 && (
            <div className="text-gray-400 pt-0.5">
              +{onlineUsers.length - 10} {t('realtime.more')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
