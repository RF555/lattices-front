import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface ConflictNotificationProps {
  /** Name of the user who made the conflicting change */
  userName: string;
  /** Refetch the stale data */
  onReload: () => void;
  /** Dismiss and keep local changes */
  onDismiss: () => void;
}

/**
 * Inline notification shown when another user updates a task that the
 * current user is editing. Offers "Reload" (refetch) or "Dismiss" (keep
 * local changes) actions.
 */
export function ConflictNotification({ userName, onReload, onDismiss }: ConflictNotificationProps) {
  const { t } = useTranslation('workspaces');

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="flex-1 text-amber-800">
        {t('realtime.conflictMessage', { name: userName })}
      </span>
      <Button variant="ghost" size="sm" onClick={onReload} className="text-amber-700 h-7 px-2">
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
        {t('realtime.reload')}
      </Button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-400 hover:text-amber-600 transition-colors"
        aria-label={t('realtime.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
