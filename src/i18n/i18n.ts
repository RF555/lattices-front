import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import todosEn from './locales/en/todos.json';
import tagsEn from './locales/en/tags.json';
import workspacesEn from './locales/en/workspaces.json';
import notificationsEn from './locales/en/notifications.json';

import commonHe from './locales/he/common.json';
import authHe from './locales/he/auth.json';
import todosHe from './locales/he/todos.json';
import tagsHe from './locales/he/tags.json';
import workspacesHe from './locales/he/workspaces.json';
import notificationsHe from './locales/he/notifications.json';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    todos: todosEn,
    tags: tagsEn,
    workspaces: workspacesEn,
    notifications: notificationsEn,
  },
  he: {
    common: commonHe,
    auth: authHe,
    todos: todosHe,
    tags: tagsHe,
    workspaces: workspacesHe,
    notifications: notificationsHe,
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'todos', 'tags', 'workspaces', 'notifications'],
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
