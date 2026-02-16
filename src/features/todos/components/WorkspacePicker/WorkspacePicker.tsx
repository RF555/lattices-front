import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';

interface WorkspacePickerProps {
  currentWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string | null) => void;
}

export function WorkspacePicker({ currentWorkspaceId, onWorkspaceChange }: WorkspacePickerProps) {
  const { t } = useTranslation('todos');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: workspaces = [] } = useWorkspaces();

  // Find current workspace name
  const currentWorkspaceName = useMemo(() => {
    if (!currentWorkspaceId) return null;
    const ws = workspaces.find((w) => w.id === currentWorkspaceId);
    return ws?.name ?? null;
  }, [workspaces, currentWorkspaceId]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (workspaceId: string | null) => {
    onWorkspaceChange(workspaceId);
    setIsOpen(false);
    setSearch('');
  };

  const searchLower = search.toLowerCase();

  const filteredWorkspaces = useMemo(() => {
    if (!search) return workspaces;
    return workspaces.filter((ws) => ws.name.toLowerCase().includes(searchLower));
  }, [workspaces, searchLower, search]);

  return (
    <div ref={containerRef} className="relative">
      {/* Closed state: combobox trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="workspace-picker-list"
        aria-haspopup="listbox"
        tabIndex={0}
        className={cn(
          'flex items-center gap-2 p-2 min-h-[38px]',
          'border rounded-md cursor-pointer',
          isOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-300',
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={cn('flex-1 text-sm truncate', !currentWorkspaceName && 'text-gray-400')}>
          {currentWorkspaceName ?? t('detail.workspacePersonal')}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 shrink-0 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="workspace-picker-list"
          role="listbox"
          className="absolute z-dropdown w-full min-w-[200px] mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={t('detail.workspaceSearchPlaceholder')}
              className="w-full outline-none text-sm px-2 py-1 border border-gray-200 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setSearch('');
                }
              }}
            />
          </div>

          <div className="p-1">
            {/* Personal (no workspace) option */}
            <button
              type="button"
              role="option"
              aria-selected={currentWorkspaceId === null}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-2 sm:py-1.5 text-left text-sm rounded',
                currentWorkspaceId === null
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700',
              )}
              onClick={() => {
                handleSelect(null);
              }}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('detail.workspacePersonal')}</span>
            </button>

            {/* Workspace options */}
            {filteredWorkspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === currentWorkspaceId}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 sm:py-1.5 text-left text-sm rounded',
                  ws.id === currentWorkspaceId
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700',
                )}
                onClick={() => {
                  handleSelect(ws.id);
                }}
              >
                <span className="truncate">{ws.name}</span>
              </button>
            ))}

            {/* Empty state */}
            {filteredWorkspaces.length === 0 && search && (
              <div className="p-4 text-center text-sm text-gray-500">
                {t('detail.workspaceSearchPlaceholder')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
