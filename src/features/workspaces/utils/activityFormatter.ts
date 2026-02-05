import type { TFunction } from 'i18next';
import type { ActivityEntry } from '../types/activity';

export function formatAction(entry: ActivityEntry, t: TFunction<'workspaces'>): string {
  const { actorName, action, entityTitle } = entry;

  const actionMap: Record<string, string> = {
    'todo.created': t('activityActions.todoCreated', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} created task "${entityTitle}"`,
    }),
    'todo.updated': t('activityActions.todoUpdated', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} updated "${entityTitle}"`,
    }),
    'todo.completed': t('activityActions.todoCompleted', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} completed "${entityTitle}"`,
    }),
    'todo.deleted': t('activityActions.todoDeleted', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} deleted "${entityTitle}"`,
    }),
    'tag.created': t('activityActions.tagCreated', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} created tag "${entityTitle}"`,
    }),
    'member.invited': t('activityActions.memberInvited', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} invited ${entityTitle}`,
    }),
    'member.joined': t('activityActions.memberJoined', {
      actor: actorName,
      defaultValue: `${actorName} joined the workspace`,
    }),
    'member.removed': t('activityActions.memberRemoved', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} removed ${entityTitle}`,
    }),
    'member.role_changed': t('activityActions.memberRoleChanged', {
      actor: actorName,
      title: entityTitle,
      defaultValue: `${actorName} changed ${entityTitle}'s role`,
    }),
    'workspace.updated': t('activityActions.workspaceUpdated', {
      actor: actorName,
      defaultValue: `${actorName} updated workspace settings`,
    }),
  };

  return actionMap[action] || `${actorName} performed ${action}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatRelativeTime(dateString: string, t: TFunction<any>): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('time.justNow', { ns: 'common' });
  if (diffMins < 60) return t('time.minutesAgo', { ns: 'common', count: diffMins });
  if (diffHours < 24) return t('time.hoursAgo', { ns: 'common', count: diffHours });
  return t('time.daysAgo', { ns: 'common', count: diffDays });
}
