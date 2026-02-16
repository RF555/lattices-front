import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { Tooltip } from '@components/ui/Tooltip';
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

  const tooltipNames = onlineUsers
    .slice(0, 10)
    .map((u) => u.displayName)
    .join(', ');
  const tooltipContent =
    onlineUsers.length > 10
      ? `${tooltipNames} +${onlineUsers.length - 10} ${t('realtime.more')}`
      : tooltipNames;

  return (
    <Tooltip content={tooltipContent}>
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs text-gray-500">
          {t('realtime.onlineCount', { count: onlineUsers.length })}
        </span>
      </div>
    </Tooltip>
  );
}
