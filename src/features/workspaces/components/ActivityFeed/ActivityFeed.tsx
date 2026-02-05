import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useWorkspaceActivity } from '../../hooks/useActivity';
import { formatAction, formatRelativeTime } from '../../utils/activityFormatter';
import type { ActivityEntry } from '../../types/activity';

const PAGE_SIZE = 20;

/** Safely render an unknown change value as a display string */
function displayValue(value: unknown): string {
  if (value == null) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

interface ActivityFeedProps {
  workspaceId: string;
}

export function ActivityFeed({ workspaceId }: ActivityFeedProps) {
  const { t } = useTranslation('workspaces');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data: activities, isLoading } = useWorkspaceActivity(workspaceId, { limit });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">{t('activity.empty')}</p>;
  }

  const getInitials = (entry: ActivityEntry) => {
    return entry.actorName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-1">
      <div className="bg-white rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-100">
          {activities.map((entry) => (
            <li key={entry.id} className="flex gap-3 px-4 py-3">
              {entry.actorAvatarUrl ? (
                <img
                  src={entry.actorAvatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                  {getInitials(entry)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">{formatAction(entry, t)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeTime(entry.createdAt, t)}
                </p>
                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                    {Object.entries(entry.changes).map(([field, change]) => (
                      <div key={field}>
                        <span className="font-medium">{field}</span>:{' '}
                        <span className="line-through text-red-400">
                          {displayValue(change.old)}
                        </span>{' '}
                        &rarr; <span className="text-green-600">{displayValue(change.new)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {activities.length >= limit && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLimit((prev) => prev + PAGE_SIZE);
            }}
          >
            {t('activity.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}
