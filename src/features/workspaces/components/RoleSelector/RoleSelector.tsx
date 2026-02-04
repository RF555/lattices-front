import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import type { WorkspaceRole } from '../../types/workspace';

const SELECTABLE_ROLES: WorkspaceRole[] = ['viewer', 'member', 'admin'];

interface RoleSelectorProps {
  currentRole?: WorkspaceRole;
  onSelect: (role: WorkspaceRole) => void;
  disabled?: boolean;
}

export function RoleSelector({ currentRole, onSelect, disabled }: RoleSelectorProps) {
  const { t } = useTranslation('workspaces');

  return (
    <div className="py-1">
      {SELECTABLE_ROLES.map((role) => (
        <button
          key={role}
          type="button"
          disabled={disabled || role === currentRole}
          className={cn(
            'flex w-full items-center justify-between px-3 py-1.5 text-left text-sm',
            'hover:bg-gray-50 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            role === currentRole && 'bg-gray-50'
          )}
          onClick={() => onSelect(role)}
        >
          <span>{t(`roles.${role}`)}</span>
          {role === currentRole && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      ))}
    </div>
  );
}
