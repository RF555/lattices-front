import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronDown,
  Check,
  Plus,
  Users,
  UsersRound,
  Activity,
  Settings,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useActiveWorkspace } from '../../hooks/useActiveWorkspace';

interface WorkspaceSwitcherProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceSwitcher({ onCreateWorkspace }: WorkspaceSwitcherProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const { activeWorkspace, workspaces, setActiveWorkspace, isAllWorkspaces, isLoading } =
    useActiveWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keyDown handler only closes dropdown on Escape
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={cn(
          'flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5',
          'text-sm font-medium text-gray-700 hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'transition-colors',
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="max-w-[140px] truncate">
          {isAllWorkspaces ? t('allWorkspaces') : activeWorkspace?.name || t('selectWorkspace')}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label={t('switchWorkspace')}
        >
          {/* All Workspaces option */}
          <button
            type="button"
            role="option"
            aria-selected={isAllWorkspaces}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
              'hover:bg-gray-50 transition-colors',
              isAllWorkspaces && 'bg-gray-50',
            )}
            onClick={() => {
              setActiveWorkspace(null);
              setIsOpen(false);
              void navigate('/app');
            }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Layers className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="flex flex-col min-w-0">
                <span className="truncate font-medium text-gray-900">{t('allWorkspaces')}</span>
                <span className="truncate text-xs text-gray-500">
                  {t('allWorkspacesDescription')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              {isAllWorkspaces && <Check className="h-4 w-4 text-primary" />}
            </div>
          </button>

          <div className="border-t border-gray-100 my-1" />

          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              role="option"
              aria-selected={!isAllWorkspaces && workspace.id === activeWorkspace?.id}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                'hover:bg-gray-50 transition-colors',
                !isAllWorkspaces && workspace.id === activeWorkspace?.id && 'bg-gray-50',
              )}
              onClick={() => {
                setActiveWorkspace(workspace.id);
                setIsOpen(false);
                void navigate('/app');
              }}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium text-gray-900">{workspace.name}</span>
                {workspace.description && (
                  <span className="truncate text-xs text-gray-500">{workspace.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {!isAllWorkspaces && workspace.id === activeWorkspace?.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          ))}

          {activeWorkspace && !isAllWorkspaces && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    void navigate(`/app/workspaces/${activeWorkspace.id}/${path}`);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-gray-50 transition-colors"
              onClick={() => {
                onCreateWorkspace();
                setIsOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('createWorkspace')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
