import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../hooks/useNotifications';
import type { NotificationPreferences as NotificationPreferencesType } from '../../types/notification';

const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_completed',
  'member_invited',
  'member_joined',
  'workspace_updated',
] as const;

export function NotificationPreferences() {
  const { t } = useTranslation('notifications');
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferencesType>({});

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const handleToggle = (type: string, channel: 'inApp' | 'email') => {
    setLocalPrefs((prev) => ({
      ...prev,
      [type]: {
        inApp: prev[type]?.inApp ?? true,
        email: prev[type]?.email ?? false,
        [channel]: !(prev[type]?.[channel] ?? (channel === 'inApp')),
      },
    }));
  };

  const handleSave = () => {
    updatePreferences.mutate(localPrefs);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('preferences.title')}</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-sm font-medium text-gray-700 px-4 py-3">
                {t('preferences.type')}
              </th>
              <th className="text-center text-sm font-medium text-gray-700 px-4 py-3 w-24">
                {t('preferences.inApp')}
              </th>
              <th className="text-center text-sm font-medium text-gray-700 px-4 py-3 w-24">
                {t('preferences.email')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {NOTIFICATION_TYPES.map((type) => (
              <tr key={type}>
                <td className="text-sm text-gray-900 px-4 py-3">
                  {t(`types.${type}`)}
                </td>
                <td className="text-center px-4 py-3">
                  <input
                    type="checkbox"
                    checked={localPrefs[type]?.inApp ?? true}
                    onChange={() => handleToggle(type, 'inApp')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="text-center px-4 py-3">
                  <input
                    type="checkbox"
                    checked={localPrefs[type]?.email ?? false}
                    onChange={() => handleToggle(type, 'email')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={updatePreferences.isPending}>
          {t('preferences.save')}
        </Button>
      </div>
    </div>
  );
}
