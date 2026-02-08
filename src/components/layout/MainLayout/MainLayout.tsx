import { useState } from 'react';
import { Outlet } from 'react-router';
import { Grid3X3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/stores/authStore';
import { WorkspaceSwitcher } from '@features/workspaces/components/WorkspaceSwitcher/WorkspaceSwitcher';
import { CreateWorkspaceDialog } from '@features/workspaces/components/CreateWorkspaceDialog/CreateWorkspaceDialog';
import { InvitationBanner } from '@features/workspaces/components/InvitationBanner/InvitationBanner';
import { NotificationBell } from '@features/notifications/components/NotificationBell/NotificationBell';
import { useNotificationRealtime } from '@features/notifications/hooks/useNotificationRealtime';
import { Button } from '@components/ui/Button';
import { LanguageSwitcher } from '@components/ui/LanguageSwitcher';
import { BottomNav } from '@components/layout/BottomNav';
import { SettingsSheet } from '@components/layout/SettingsSheet';
import { WorkspaceSheet } from '@components/layout/WorkspaceSheet';

export function MainLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  // Establish Supabase Realtime subscription for notifications
  useNotificationRealtime();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-gray-900">
              <Grid3X3 className="w-5 h-5 text-primary" />
              {t('brand.name')}
            </h1>
            <div className="hidden sm:block h-6 w-px bg-gray-200" />
            <WorkspaceSwitcher
              onCreateWorkspace={() => {
                setShowCreateWorkspace(true);
              }}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
            {user && (
              <span className="hidden sm:inline text-sm text-gray-600">
                {user.name ?? user.email}
              </span>
            )}
            <div className="hidden sm:flex">
              <LanguageSwitcher />
            </div>
            <div className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void logout();
                }}
              >
                {t('nav.signOut')}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <InvitationBanner />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 sm:pb-8">
        <Outlet />
      </main>
      <CreateWorkspaceDialog
        isOpen={showCreateWorkspace}
        onClose={() => {
          setShowCreateWorkspace(false);
        }}
      />
      <BottomNav />
      <WorkspaceSheet
        onCreateWorkspace={() => {
          setShowCreateWorkspace(true);
        }}
      />
      <SettingsSheet />
    </div>
  );
}
