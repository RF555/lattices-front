import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { wakeUpBackend } from '@lib/api/wakeUp';
import { COLD_START } from '@/constants';

type BannerState = 'hidden' | 'waking' | 'ready';

export function ColdStartBanner() {
  const { t } = useTranslation();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');

  useEffect(() => {
    let mounted = true;
    const startTime = Date.now();

    // Show "waking up" banner after delay if still waiting
    const delayTimer = setTimeout(() => {
      if (mounted) setBannerState('waking');
    }, COLD_START.SHOW_DELAY_MS);

    void wakeUpBackend().then((isAwake) => {
      if (!mounted) return;
      clearTimeout(delayTimer);

      const elapsed = Date.now() - startTime;

      if (isAwake && elapsed < COLD_START.FAST_THRESHOLD_MS) {
        // Fast response: never show the banner
        setBannerState('hidden');
      } else if (isAwake) {
        // Slow but successful: show "ready" briefly
        setBannerState('ready');
        setTimeout(() => {
          if (mounted) setBannerState('hidden');
        }, COLD_START.READY_DISPLAY_MS);
      } else {
        // All retries failed — hide banner, user will see errors from actual API calls
        setBannerState('hidden');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(delayTimer);
    };
  }, []);

  if (bannerState === 'hidden') return null;

  return (
    <div className="sticky top-0 z-banner">
      <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm animate-in slide-in-from-top-1 fade-in duration-200">
        {bannerState === 'waking' ? (
          <>
            <span className="inline-block animate-pulse me-2">&#x23F3;</span>
            {t('coldStart.waking')}
          </>
        ) : (
          <>
            <span className="me-2">&#x2713;</span>
            {t('coldStart.ready')}
          </>
        )}
      </div>
    </div>
  );
}
