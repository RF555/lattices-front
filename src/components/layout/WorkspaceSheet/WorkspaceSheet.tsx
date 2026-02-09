import { useNavigate } from 'react-router';
import { Check, Plus, Users, UsersRound, Activity, Settings, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { BottomSheet } from '@components/ui/BottomSheet';
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

  const close = () => {
    setOpen(false);
  };

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={setOpen}
      title={t('switchWorkspace')}
      maxHeight="max-h-[70vh]"
    >
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
            <span className="truncate text-sm font-medium text-gray-900">{t('allWorkspaces')}</span>
            <span className="truncate text-xs text-gray-500">{t('allWorkspacesDescription')}</span>
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
              <span className="truncate text-sm font-medium text-gray-900">{workspace.name}</span>
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

      {/* Bottom spacing */}
      <div className="h-4" />
    </BottomSheet>
  );
}
