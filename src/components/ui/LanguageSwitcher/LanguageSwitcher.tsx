import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Tooltip } from '@components/ui/Tooltip';

const LANGUAGES = [
  { code: 'en', label: 'EN', tooltipKey: 'tooltips.languageEnglish' },
  { code: 'he', label: 'עב', tooltipKey: 'tooltips.languageHebrew' },
] as const;

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <Languages className="w-4 h-4 text-gray-400" />
      {LANGUAGES.map((lang) => (
        <Tooltip key={lang.code} content={t(lang.tooltipKey)}>
          <button
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
        </Tooltip>
      ))}
    </div>
  );
}
