import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';
import { ToggleSwitch } from '@components/ui/ToggleSwitch';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@features/notifications/hooks/useNotifications';
import { useNotificationUiStore } from '@features/notifications/stores/notificationUiStore';
import {
  NOTIFICATION_CATEGORIES,
  MANDATORY_NOTIFICATION_TYPES,
} from '@features/notifications/types/notification';
import type { NotificationPreference } from '@features/notifications/types/notification';

const CATEGORY_KEYS = {
  task: 'preferences.taskNotifications',
  workspace: 'preferences.workspaceNotifications',
  invitation: 'preferences.invitationNotifications',
  group: 'preferences.groupNotifications',
} as const;

export function NotificationPreferences() {
  const { t } = useTranslation('notifications');
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreferences();
  const showToastOnNew = useNotificationUiStore((s) => s.showToastOnNew);
  const setShowToastOnNew = useNotificationUiStore((s) => s.setShowToastOnNew);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const isEnabled = (typeName: string, channel: 'in_app' | 'email'): boolean => {
    if (!preferences) return true;
    const pref = preferences.find(
      (p: NotificationPreference) => p.notificationType === typeName && p.channel === channel,
    );
    return pref ? pref.enabled : true; // Default: enabled
  };

  const handleToggle = (typeName: string, channel: 'in_app' | 'email', currentEnabled: boolean) => {
    updatePreference.mutate({
      channel,
      enabled: !currentEnabled,
      notificationType: typeName,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('preferences.title')}</h2>
      </div>

      {/* Notification type categories */}
      {(
        Object.entries(NOTIFICATION_CATEGORIES) as [
          keyof typeof NOTIFICATION_CATEGORIES,
          readonly string[],
        ][]
      ).map(([category, types]) => (
        <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Category header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">{t(CATEGORY_KEYS[category])}</h3>
            <span className="text-xs font-medium text-gray-500">{t('preferences.inApp')}</span>
          </div>

          {/* Type rows */}
          <div className="divide-y divide-gray-100">
            {types.map((typeName) => {
              const isMandatory = MANDATORY_NOTIFICATION_TYPES.has(typeName);
              const enabled = isEnabled(typeName, 'in_app');
              const typeLabel = (t as (key: string) => string)(`typeLabel.${typeName}`);

              return (
                <div key={typeName} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{typeLabel}</p>
                    {isMandatory && (
                      <p className="text-xs text-gray-500 mt-0.5">{t('preferences.mandatory')}</p>
                    )}
                  </div>
                  <ToggleSwitch
                    checked={isMandatory || enabled}
                    onChange={() => {
                      handleToggle(typeName, 'in_app', enabled);
                    }}
                    disabled={isMandatory}
                    label={typeLabel}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* General settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">{t('preferences.general')}</h3>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-900">{t('preferences.showToast')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('preferences.showToastDescription')}</p>
          </div>
          <ToggleSwitch
            checked={showToastOnNew}
            onChange={setShowToastOnNew}
            label={t('preferences.showToast')}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
