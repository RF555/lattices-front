import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { wakeUpBackend } from '@lib/api/wakeUp';

type BannerState = 'hidden' | 'waking' | 'ready';

export function ColdStartBanner() {
  const { t } = useTranslation();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');

  useEffect(() => {
    let mounted = true;
    const startTime = Date.now();

    // Show "waking up" banner after 2s if still waiting
    const delayTimer = setTimeout(() => {
      if (mounted) setBannerState('waking');
    }, 2000);

    void wakeUpBackend().then((isAwake) => {
      if (!mounted) return;
      clearTimeout(delayTimer);

      const elapsed = Date.now() - startTime;

      if (isAwake && elapsed < 2000) {
        // Fast response: never show the banner
        setBannerState('hidden');
      } else if (isAwake) {
        // Slow but successful: show "ready" briefly
        setBannerState('ready');
        setTimeout(() => {
          if (mounted) setBannerState('hidden');
        }, 1500);
      } else {
        // Failed: keep showing waking state (will retry on next API call)
        setBannerState('waking');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(delayTimer);
    };
  }, []);

  if (bannerState === 'hidden') return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm">
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
