import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Check, Plus, Users, UsersRound, Activity, Settings, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useActiveWorkspace } from '@features/workspaces/hooks/useActiveWorkspace';
import { useMobileNavStore } from '@stores/mobileNavStore';

interface WorkspaceSheetProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceSheet({ onCreateWorkspace }: WorkspaceSheetProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, setActiveWorkspace, isAllWorkspaces } = useActiveWorkspace();
  const isOpen = useMobileNavStore((s) => s.workspaceSwitcherOpen);
  const setOpen = useMobileNavStore((s) => s.setWorkspaceSwitcherOpen);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-overlay bg-black/40 sm:hidden"
        onClick={close}
        aria-label={t('switchWorkspace')}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-modal sm:hidden',
          'bg-white rounded-t-2xl shadow-lg',
          'animate-in slide-in-from-bottom duration-200',
          'pb-safe',
          'max-h-[70vh] flex flex-col',
        )}
        role="dialog"
        aria-label={t('switchWorkspace')}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* All Workspaces option */}
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between px-4 py-3 text-left',
              'hover:bg-gray-50 transition-colors min-h-[44px]',
              isAllWorkspaces && 'bg-gray-50',
            )}
            onClick={() => {
              setActiveWorkspace(null);
              close();
              void navigate('/app');
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Layers className="h-5 w-5 shrink-0 text-gray-500" />
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-medium text-gray-900">
                  {t('allWorkspaces')}
                </span>
                <span className="truncate text-xs text-gray-500">
                  {t('allWorkspacesDescription')}
                </span>
              </div>
            </div>
            {isAllWorkspaces && <Check className="h-5 w-5 shrink-0 text-primary ms-2" />}
          </button>

          <div className="border-t border-gray-100" />

          {/* Workspace list */}
          {workspaces.map((workspace) => {
            const isActive = !isAllWorkspaces && workspace.id === activeWorkspace?.id;
            return (
              <button
                key={workspace.id}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3 text-left',
                  'hover:bg-gray-50 transition-colors min-h-[44px]',
                  isActive && 'bg-gray-50',
                )}
                onClick={() => {
                  setActiveWorkspace(workspace.id);
                  close();
                  void navigate('/app');
                }}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {workspace.name}
                  </span>
                  {workspace.description && (
                    <span className="truncate text-xs text-gray-500">{workspace.description}</span>
                  )}
                </div>
                {isActive && <Check className="h-5 w-5 shrink-0 text-primary ms-2" />}
              </button>
            );
          })}

          {/* Manage workspace section */}
          {activeWorkspace && !isAllWorkspaces && (
            <div className="border-t border-gray-100 pt-1">
              <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('switcher.manage')}
              </p>
              {[
                { icon: Users, label: t('sidebar.members'), path: 'members' },
                { icon: UsersRound, label: t('sidebar.groups'), path: 'groups' },
                { icon: Activity, label: t('sidebar.activity'), path: 'activity' },
                { icon: Settings, label: t('sidebar.settings'), path: 'settings' },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 min-h-[44px] transition-colors"
                  onClick={() => {
                    void navigate(`/app/workspaces/${activeWorkspace.id}/${path}`);
                    close();
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Create workspace */}
          <div className="border-t border-gray-100 pt-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-primary hover:bg-gray-50 min-h-[44px] transition-colors"
              onClick={() => {
                onCreateWorkspace();
                close();
              }}
            >
              <Plus className="h-5 w-5" />
              {t('createWorkspace')}
            </button>
          </div>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-4 shrink-0" />
      </div>
    </>
  );
}
