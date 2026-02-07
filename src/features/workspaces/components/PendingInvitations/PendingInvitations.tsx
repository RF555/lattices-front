import { useTranslation } from 'react-i18next';
import { Clock, X } from 'lucide-react';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { useWorkspaceInvitations, useRevokeInvitation } from '../../hooks/useInvitations';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import type { WorkspaceRole } from '../../types/workspace';

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

interface PendingInvitationsProps {
  workspaceId: string;
}

export function PendingInvitations({ workspaceId }: PendingInvitationsProps) {
  const { t } = useTranslation('workspaces');
  const { data: invitations, isLoading } = useWorkspaceInvitations(workspaceId);
  const revokeInvitation = useRevokeInvitation();
  const { canManageMembers } = useWorkspacePermission(workspaceId);

  const pendingInvitations = invitations?.filter((inv) => inv.status === 'pending') ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (pendingInvitations.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Clock className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700">
          {t('invitation.pending')} ({pendingInvitations.length})
        </h3>
      </div>

      <ul className="divide-y divide-gray-100">
        {pendingInvitations.map((invitation) => (
          <li key={invitation.id} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{invitation.email}</p>
              <p className="text-xs text-gray-500">
                {t('invitation.invitedBy', { name: invitation.invitedByName })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  ROLE_COLORS[invitation.role],
                )}
              >
                {t(`roles.${invitation.role}`)}
              </span>

              {canManageMembers && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    revokeInvitation.mutate({
                      workspaceId,
                      invitationId: invitation.id,
                    });
                  }}
                  disabled={revokeInvitation.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
