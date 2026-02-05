import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@lib/utils/cn';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'he', label: 'עב' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <Languages className="w-4 h-4 text-gray-400" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => {
            void i18n.changeLanguage(lang.code);
          }}
          className={cn(
            'px-2 py-1 text-xs font-medium rounded transition-colors',
            i18n.resolvedLanguage === lang.code
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
          )}
          aria-pressed={i18n.resolvedLanguage === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
