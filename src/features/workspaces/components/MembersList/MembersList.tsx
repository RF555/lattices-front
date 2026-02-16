import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Crown, LogOut, MoreHorizontal, UserPlus } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { useAuthStore } from '@features/auth/stores/authStore';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { Tooltip } from '@components/ui/Tooltip';
import { ConfirmationDialog } from '@components/feedback/ConfirmationDialog';
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from '@features/workspaces/hooks/useWorkspaceMembers';
import { useWorkspacePermission } from '@features/workspaces/hooks/useWorkspacePermission';
import { InviteMemberDialog } from '../InviteMemberDialog/InviteMemberDialog';
import { RoleSelector } from '../RoleSelector/RoleSelector';
import type { WorkspaceMember, WorkspaceRole } from '@features/workspaces/types/workspace';

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

interface MembersListProps {
  workspaceId: string;
}

export function MembersList({ workspaceId }: MembersListProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { canManageMembers } = useWorkspacePermission(workspaceId);
  const [showInvite, setShowInvite] = useState(false);
  const [actionMember, setActionMember] = useState<WorkspaceMember | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [newRole, setNewRole] = useState<WorkspaceRole>('member');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">{t('members.noMembers')}</p>;
  }

  const handleRoleChange = (member: WorkspaceMember, role: WorkspaceRole) => {
    setActionMember(member);
    setNewRole(role);
    setShowRoleChange(true);
  };

  const confirmRoleChange = () => {
    if (!actionMember) return;
    void updateRole
      .mutateAsync({
        workspaceId,
        userId: actionMember.userId,
        role: newRole,
      })
      .then(() => {
        setShowRoleChange(false);
        setActionMember(null);
      });
  };

  const handleRemove = (member: WorkspaceMember) => {
    setActionMember(member);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = () => {
    if (!actionMember) return;
    void removeMember
      .mutateAsync({
        workspaceId,
        userId: actionMember.userId,
      })
      .then(() => {
        setShowRemoveConfirm(false);
        setActionMember(null);
      });
  };

  const confirmLeave = () => {
    if (!user) return;
    void removeMember
      .mutateAsync({
        workspaceId,
        userId: user.id,
      })
      .then(() => {
        setShowLeaveConfirm(false);
        void navigate('/app');
      });
  };

  const getInitials = (member: WorkspaceMember) => {
    const name = member.displayName ?? member.email;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">
          {t('members.title')} ({members.length})
        </h3>
        {canManageMembers && (
          <Button
            size="sm"
            onClick={() => {
              setShowInvite(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {t('members.invite')}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-gray-100">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          return (
            <li
              key={member.userId}
              className={cn(
                'flex items-center justify-between px-4 py-3',
                isCurrentUser && 'bg-blue-50/50',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {getInitials(member)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.displayName ?? member.email}
                    {isCurrentUser && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                  </p>
                  {member.displayName && (
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {member.role === 'owner' && (
                  <Tooltip content={t('tooltips.workspaceOwner')}>
                    <span className="inline-flex">
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </span>
                  </Tooltip>
                )}
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    ROLE_COLORS[member.role],
                  )}
                >
                  {t(`roles.${member.role}`)}
                </span>

                {isCurrentUser && member.role !== 'owner' && (
                  <Tooltip content={t('members.leaveWorkspace')}>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={t('members.leaveWorkspace')}
                      onClick={() => {
                        setShowLeaveConfirm(true);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </Tooltip>
                )}

                {canManageMembers && member.role !== 'owner' && !isCurrentUser && (
                  <div className="relative group">
                    <Tooltip content={t('tooltips.memberActions')}>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        aria-label={t('members.actions')}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <div className="absolute right-0 top-full z-dropdown hidden group-focus-within:block bg-white rounded-md shadow-lg border border-gray-200 py-1 w-40">
                      <RoleSelector
                        currentRole={member.role}
                        onSelect={(role) => {
                          handleRoleChange(member, role);
                        }}
                      />
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            handleRemove(member);
                          }}
                        >
                          {t('members.remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <InviteMemberDialog
        isOpen={showInvite}
        onClose={() => {
          setShowInvite(false);
        }}
        workspaceId={workspaceId}
      />

      <ConfirmationDialog
        isOpen={showRoleChange}
        onConfirm={confirmRoleChange}
        onCancel={() => {
          setShowRoleChange(false);
        }}
        title={t('members.changeRole')}
        message={t('members.changeRoleConfirm', {
          name: actionMember?.displayName ?? actionMember?.email,
          oldRole: actionMember ? t(`roles.${actionMember.role}`) : '',
          newRole: t(`roles.${newRole}`),
        })}
        variant="primary"
      />

      <ConfirmationDialog
        isOpen={showRemoveConfirm}
        onConfirm={confirmRemove}
        onCancel={() => {
          setShowRemoveConfirm(false);
        }}
        title={t('members.removeMember')}
        message={
          t('members.removeConfirm', {
            name: actionMember?.displayName ?? actionMember?.email,
          }) +
          ' ' +
          t('members.removeWarning')
        }
        variant="danger"
      />

      <ConfirmationDialog
        isOpen={showLeaveConfirm}
        onConfirm={confirmLeave}
        onCancel={() => {
          setShowLeaveConfirm(false);
        }}
        title={t('members.leaveWorkspace')}
        message={t('members.leaveConfirm') + ' ' + t('members.leaveWarning')}
        variant="danger"
      />
    </div>
  );
}
