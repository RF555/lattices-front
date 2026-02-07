import { useTranslation } from 'react-i18next';
import { Button } from '@components/ui/Button';

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5M12 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('error.somethingWentWrong')}</h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">{t('error.unexpectedError')}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry}>{t('actions.tryAgain')}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.reload();
          }}
        >
          {t('actions.reloadPage')}
        </Button>
      </div>
      {import.meta.env.DEV && error && (
        <pre className="mt-6 p-4 bg-gray-100 rounded-md text-xs text-red-600 max-w-full overflow-auto">
          {error.message}
          {'\n'}
          {error.stack}
        </pre>
      )}
    </div>
  );
}
