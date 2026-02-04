import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { Modal } from '@components/ui/Modal/Modal';
import {
  useGroup,
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
} from '../../hooks/useGroups';
import { useWorkspaceMembers } from '../../hooks/useWorkspaceMembers';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { GroupManageDialog } from '../GroupManageDialog/GroupManageDialog';
import type { GroupMember } from '../../types/group';

interface GroupDetailProps {
  workspaceId: string;
  groupId: string;
}

export function GroupDetail({ workspaceId, groupId }: GroupDetailProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const { data: group, isLoading: groupLoading } = useGroup(workspaceId, groupId);
  const { data: members, isLoading: membersLoading } = useGroupMembers(workspaceId, groupId);
  const { data: workspaceMembers } = useWorkspaceMembers(workspaceId);
  const addMember = useAddGroupMember(workspaceId, groupId);
  const removeMember = useRemoveGroupMember(workspaceId, groupId);
  const { canManageMembers } = useWorkspacePermission(workspaceId);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<GroupMember | null>(null);

  if (groupLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!group) {
    return <p className="text-sm text-gray-500 text-center py-8">Group not found</p>;
  }

  // Members available to add (not already in group)
  const memberIds = new Set(members?.map((m) => m.userId) || []);
  const availableMembers = workspaceMembers?.filter((wm) => !memberIds.has(wm.userId)) || [];

  const handleAddMember = (userId: string) => {
    addMember.mutate({ userId }, { onSuccess: () => setShowAddMember(false) });
  };

  const handleRemoveMember = () => {
    if (!confirmRemove) return;
    removeMember.mutate(confirmRemove.userId, {
      onSuccess: () => setConfirmRemove(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/workspaces/${workspaceId}/groups`)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
          )}
        </div>
        {canManageMembers && (
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            {t('groups.edit')}
          </Button>
        )}
      </div>

      {/* Members Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">{t('groups.members')}</h3>
          {canManageMembers && (
            <Button variant="ghost" size="sm" onClick={() => setShowAddMember(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              {t('groups.addMember')}
            </Button>
          )}
        </div>

        {membersLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : !members || members.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{t('groups.noMembers')}</p>
        ) : (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 px-4 py-3">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {(member.displayName || member.email).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.displayName || member.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(member)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label={t('groups.removeMember')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Group Dialog */}
      <GroupManageDialog
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        workspaceId={workspaceId}
        group={group}
      />

      {/* Add Member Dialog */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title={t('groups.addMember')}
      >
        {availableMembers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">All workspace members are already in this group.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {availableMembers.map((wm) => (
              <button
                key={wm.userId}
                type="button"
                className="flex w-full items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded transition-colors"
                onClick={() => handleAddMember(wm.userId)}
              >
                {wm.avatarUrl ? (
                  <img
                    src={wm.avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {(wm.displayName || wm.email).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-900">{wm.displayName || wm.email}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Remove Member Confirmation */}
      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title={t('groups.removeMember')}
      >
        <p className="text-sm text-gray-600 mb-4">
          Remove {confirmRemove?.displayName || confirmRemove?.email} from this group?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>
            {t('form.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveMember}
            isLoading={removeMember.isPending}
          >
            {t('groups.removeMember')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
