import { NavLink, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  Tag,
  Users,
  Activity,
  Settings,
  UsersRound,
  X,
} from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { useWorkspaceUiStore } from '../../stores/workspaceUiStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  );

export function WorkspaceSidebar() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('workspaces');
  const sidebarOpen = useWorkspaceUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useWorkspaceUiStore((s) => s.toggleSidebar);
  const { canManageMembers } = useWorkspacePermission(id);

  if (!sidebarOpen || !id) return null;

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('sidebar.navigation')}
        </h3>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={t('sidebar.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="space-y-1">
        <NavLink to={`/app/workspaces/${id}`} end className={navLinkClass}>
          <CheckSquare className="h-4 w-4" />
          {t('sidebar.todos')}
        </NavLink>
        <NavLink to={`/app/workspaces/${id}/tags`} className={navLinkClass}>
          <Tag className="h-4 w-4" />
          {t('sidebar.tags')}
        </NavLink>
        <NavLink to={`/app/workspaces/${id}/members`} className={navLinkClass}>
          <Users className="h-4 w-4" />
          {t('sidebar.members')}
        </NavLink>
        <NavLink to={`/app/workspaces/${id}/activity`} className={navLinkClass}>
          <Activity className="h-4 w-4" />
          {t('sidebar.activity')}
        </NavLink>
        <NavLink to={`/app/workspaces/${id}/groups`} className={navLinkClass}>
          <UsersRound className="h-4 w-4" />
          {t('sidebar.groups')}
        </NavLink>
        {canManageMembers && (
          <NavLink to={`/app/workspaces/${id}/settings`} className={navLinkClass}>
            <Settings className="h-4 w-4" />
            {t('sidebar.settings')}
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
