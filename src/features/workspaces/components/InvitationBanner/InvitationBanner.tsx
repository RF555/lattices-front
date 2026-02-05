import { useTranslation } from 'react-i18next';
import { Mail, X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { usePendingInvitations, useAcceptInvitationById } from '../../hooks/useInvitations';

export function InvitationBanner() {
  const { t } = useTranslation('workspaces');
  const { data: invitations } = usePendingInvitations();
  const acceptInvitation = useAcceptInvitationById();

  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2 text-blue-700">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{t('invitation.banner', { workspace: invitation.workspaceName })}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => acceptInvitation.mutate(invitation.id)}
                isLoading={acceptInvitation.isPending}
              >
                {t('invitation.accept')}
              </Button>
              <button
                type="button"
                className="p-1 text-blue-400 hover:text-blue-600"
                aria-label={t('invitation.decline')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
