import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@components/ui/Button';

export function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-20 sm:bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-96 z-toast"
      role="alert"
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <p className="text-sm text-gray-700 flex-1">{t('pwa.updateAvailable')}</p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              void updateServiceWorker(true);
            }}
          >
            {t('actions.reloadPage')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setNeedRefresh(false);
            }}
          >
            {t('actions.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
