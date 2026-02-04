export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Todos
  todos: {
    all: ['todos'] as const,
    lists: () => [...queryKeys.todos.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.todos.lists(), filters] as const,
    details: () => [...queryKeys.todos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.todos.details(), id] as const,
  },

  // Tags
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (filters?: object) => [...queryKeys.tags.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.tags.all, 'detail', id] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, 'detail', id] as const,
    members: (workspaceId: string) =>
      [...queryKeys.workspaces.all, workspaceId, 'members'] as const,
    invitations: (workspaceId: string) =>
      [...queryKeys.workspaces.all, workspaceId, 'invitations'] as const,
    activity: (workspaceId: string) =>
      [...queryKeys.workspaces.all, workspaceId, 'activity'] as const,
    groups: (workspaceId: string) =>
      [...queryKeys.workspaces.all, workspaceId, 'groups'] as const,
    groupDetail: (workspaceId: string, groupId: string) =>
      [...queryKeys.workspaces.groups(workspaceId), groupId] as const,
    groupMembers: (workspaceId: string, groupId: string) =>
      [...queryKeys.workspaces.groupDetail(workspaceId, groupId), 'members'] as const,
  },

  // Invitations (user-scoped)
  invitations: {
    all: ['invitations'] as const,
    pending: () => [...queryKeys.invitations.all, 'pending'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: (workspaceId?: string) =>
      [...queryKeys.notifications.all, 'unread-count', workspaceId] as const,
    totalUnreadCount: () =>
      [...queryKeys.notifications.all, 'total-unread-count'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
    types: () => [...queryKeys.notifications.all, 'types'] as const,
  },
} as const;
