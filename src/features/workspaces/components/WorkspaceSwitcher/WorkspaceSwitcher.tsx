import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useActiveWorkspace } from '../../hooks/useActiveWorkspace';
import type { WorkspaceRole } from '../../types/workspace';

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

interface WorkspaceSwitcherProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceSwitcher({ onCreateWorkspace }: WorkspaceSwitcherProps) {
  const { t } = useTranslation('workspaces');
  const { activeWorkspace, workspaces, setActiveWorkspace, isLoading } =
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
    );
  }

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5',
          'text-sm font-medium text-gray-700 hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="max-w-[140px] truncate">
          {activeWorkspace?.name || t('selectWorkspace')}
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
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              role="option"
              aria-selected={workspace.id === activeWorkspace?.id}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                'hover:bg-gray-50 transition-colors',
                workspace.id === activeWorkspace?.id && 'bg-gray-50'
              )}
              onClick={() => {
                setActiveWorkspace(workspace.id);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium text-gray-900">
                  {workspace.name}
                </span>
                {workspace.description && (
                  <span className="truncate text-xs text-gray-500">
                    {workspace.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {workspace.id === activeWorkspace?.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          ))}

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
