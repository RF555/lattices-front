import type { TFunction } from 'i18next';
import type { Notification } from '../types/notification';

/**
 * Format a notification message using i18n templates with metadata interpolation.
 * Falls back to generic message if translation key is missing.
 */
export function formatNotificationMessage(
  notification: Notification,
  t: TFunction<'notifications'>
): string {
  const { type, metadata } = notification;
  const actorName = metadata.actorName || t('unknownActor', { defaultValue: 'Someone' });
  const entityTitle = metadata.entityTitle || t('unknownEntity', { defaultValue: 'an item' });
  const workspaceName = metadata.workspaceName || t('unknownWorkspace', { defaultValue: 'a workspace' });

  return t(`type.${type}`, {
    actorName,
    entityTitle,
    workspaceName,
    newRole: metadata.newRole || '',
    groupName: metadata.groupName || '',
    defaultValue: `${actorName}: ${type}`,
  });
}

/**
 * Build the route to navigate to when a notification is clicked.
 */
export function getEntityRoute(notification: Notification): string {
  const { entityType, entityId, workspaceId } = notification;

  switch (entityType) {
    case 'todo':
      // Navigate to workspace dashboard (todos page)
      return `/app`;
    case 'workspace':
      return `/app/workspaces/${workspaceId}/settings`;
    case 'invitation':
      return `/app`;
    case 'group':
      return `/app/workspaces/${workspaceId}/groups/${entityId}`;
    default:
      return `/app`;
  }
}

/**
 * Get the actor initials for avatar fallback.
 */
export function getActorInitials(notification: Notification): string {
  const name = notification.metadata.actorName;
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}
