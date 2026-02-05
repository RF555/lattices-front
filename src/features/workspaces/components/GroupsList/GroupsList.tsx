import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { Modal } from '@components/ui/Modal/Modal';
import { useGroups, useDeleteGroup } from '../../hooks/useGroups';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { GroupManageDialog } from '../GroupManageDialog/GroupManageDialog';
import type { Group } from '../../types/group';

interface GroupsListProps {
  workspaceId: string;
}

export function GroupsList({ workspaceId }: GroupsListProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups(workspaceId);
  const deleteGroup = useDeleteGroup(workspaceId);
  const { canManageMembers } = useWorkspacePermission(workspaceId);

  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteGroup.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t('groups.title')}</h2>
        {canManageMembers && (
          <Button
            size="sm"
            onClick={() => {
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('groups.create')}
          </Button>
        )}
      </div>

      {!groups || groups.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">{t('groups.noGroups')}</p>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition-colors w-full"
              onClick={() => {
                void navigate(`/workspaces/${workspaceId}/groups/${group.id}`);
              }}
            >
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{group.name}</h3>
                {group.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {group.memberCount} {t('sidebar.members').toLowerCase()}
              </span>
              {canManageMembers && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(group);
                  }}
                  aria-label={t('groups.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <GroupManageDialog
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
        }}
        workspaceId={workspaceId}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => {
          setConfirmDelete(null);
        }}
        title={t('groups.delete')}
      >
        <p className="text-sm text-gray-600 mb-4">
          {t('groups.deleteConfirm', { name: confirmDelete?.name })}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirmDelete(null);
            }}
          >
            {t('form.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteGroup.isPending}
          >
            {t('groups.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
