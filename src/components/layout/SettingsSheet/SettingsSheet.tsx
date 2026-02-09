import { useNavigate } from 'react-router';
import { LogOut, Languages, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { BottomSheet } from '@components/ui/BottomSheet';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useActiveWorkspace } from '@features/workspaces/hooks/useActiveWorkspace';
import { useMobileNavStore } from '@stores/mobileNavStore';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
] as const;

export function SettingsSheet() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { activeWorkspace, isAllWorkspaces } = useActiveWorkspace();
  const isOpen = useMobileNavStore((s) => s.settingsSheetOpen);
  const setOpen = useMobileNavStore((s) => s.setSettingsSheetOpen);

  return (
    <BottomSheet open={isOpen} onOpenChange={setOpen} title={t('nav.settings')}>
      {/* User info */}
      {user && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name ?? user.email}</p>
            {user.name && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
          </div>
        </div>
      )}

      {/* Language toggle */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <Languages className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('nav.language')}</span>
        </div>
        <div className="flex gap-2 ms-8">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(lang.code);
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px]',
                i18n.resolvedLanguage === lang.code
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
              aria-pressed={i18n.resolvedLanguage === lang.code}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace settings link */}
      {activeWorkspace && !isAllWorkspaces && (
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px] transition-colors"
          onClick={() => {
            void navigate(`/app/workspaces/${activeWorkspace.id}/settings`);
            setOpen(false);
          }}
        >
          <Settings className="h-5 w-5 text-gray-500" />
          <span>{t('nav.workspaceSettings')}</span>
        </button>
      )}

      {/* Sign out */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 min-h-[44px] transition-colors"
          onClick={() => {
            void logout();
            setOpen(false);
          }}
        >
          <LogOut className="h-5 w-5" />
          <span>{t('nav.signOut')}</span>
        </button>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </BottomSheet>
  );
}
