import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sets `dir` and `lang` attributes on `<html>` based on the current i18n language.
 * Call once in the root App component.
 */
export function useDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.dir();
    const lang = i18n.resolvedLanguage ?? 'en';

    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [i18n, i18n.resolvedLanguage]);
}
