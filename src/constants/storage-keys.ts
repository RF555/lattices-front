/**
 * LocalStorage key registry for Zustand persisted stores.
 * Keys match existing values to preserve user state.
 */
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  TODO_UI: 'todo-ui-storage',
  NOTIFICATION_UI: 'notification-ui-storage',
  WORKSPACE_UI: 'workspace-ui-storage',
  QUERY_CACHE: 'lattices-query-cache',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
