import { useTranslation } from 'react-i18next';
import { useToastStore } from '@stores/toastStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-auto z-toast space-y-2"
      role="region"
      aria-label={t('notifications.region')}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
