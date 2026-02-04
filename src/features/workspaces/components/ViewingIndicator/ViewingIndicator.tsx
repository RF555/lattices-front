import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import type { PresenceUser } from '@lib/realtime';

interface ViewingIndicatorProps {
  viewers: PresenceUser[];
  className?: string;
}

/**
 * Displays small avatars of users currently viewing a specific task.
 * Shown inline within each TodoItem that has active viewers (excluding self).
 */
export function ViewingIndicator({ viewers, className }: ViewingIndicatorProps) {
  const { t } = useTranslation('workspaces');

  if (viewers.length === 0) return null;

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      title={t('realtime.viewingTooltip', {
        names: viewers.map((v) => v.displayName).join(', '),
      })}
    >
      <Eye className="h-3 w-3 text-blue-400" />
      <div className="flex -space-x-1.5">
        {viewers.slice(0, 3).map((viewer) =>
          viewer.avatarUrl ? (
            <img
              key={viewer.userId}
              src={viewer.avatarUrl}
              alt={viewer.displayName}
              className="h-4 w-4 rounded-full border border-white object-cover"
            />
          ) : (
            <div
              key={viewer.userId}
              className="h-4 w-4 rounded-full border border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600"
            >
              {viewer.displayName.slice(0, 1).toUpperCase()}
            </div>
          )
        )}
        {viewers.length > 3 && (
          <div className="h-4 w-4 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">
            +{viewers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
