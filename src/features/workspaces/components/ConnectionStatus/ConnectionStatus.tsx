import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { realtimeManager, type ConnectionStatus as Status } from '@lib/realtime';

/**
 * Small indicator that shows the current Supabase Realtime connection state.
 * Auto-hides when connected; only visible during reconnection or disconnection.
 */
export function ConnectionStatus() {
  const { t } = useTranslation('workspaces');
  const [status, setStatus] = useState<Status>(realtimeManager.getConnectionStatus());

  useEffect(() => {
    realtimeManager.setConnectionCallbacks({
      onStatusChange: setStatus,
    });

    return () => {
      realtimeManager.setConnectionCallbacks({});
    };
  }, []);

  // Hide when connected or when no connection has been attempted
  if (status === 'connected' || status === 'idle') return null;

  const isConnecting = status === 'connecting';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isConnecting
          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          : 'bg-red-50 text-red-700 border border-red-200',
      )}
      title={t(`realtime.status.${status}`)}
    >
      {isConnecting ? <Wifi className="h-3 w-3 animate-pulse" /> : <WifiOff className="h-3 w-3" />}
      <span>{t(`realtime.status.${status}`)}</span>
    </div>
  );
}
