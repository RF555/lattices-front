import { useState, useEffect, useRef } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@stores/toastStore';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      wasOfflineRef.current = true;
    };

    const handleOnline = () => {
      setIsOffline(false);
      if (wasOfflineRef.current) {
        toast.success(t('pwa.backOnline'));
        wasOfflineRef.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [t]);

  if (!isOffline) return null;

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-700">{t('pwa.offline')}</p>
    </div>
  );
}
