import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { MembersList } from '../components/MembersList/MembersList';
import { PendingInvitations } from '../components/PendingInvitations/PendingInvitations';

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('workspaces');

  if (!id) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('members.title')}</h2>
      </div>
      <MembersList workspaceId={id} />
      <PendingInvitations workspaceId={id} />
    </div>
  );
}
