import type commonEn from './locales/en/common.json';
import type authEn from './locales/en/auth.json';
import type todosEn from './locales/en/todos.json';
import type tagsEn from './locales/en/tags.json';
import type workspacesEn from './locales/en/workspaces.json';
import type notificationsEn from './locales/en/notifications.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonEn;
      auth: typeof authEn;
      todos: typeof todosEn;
      tags: typeof tagsEn;
      workspaces: typeof workspacesEn;
      notifications: typeof notificationsEn;
    };
  }
}
