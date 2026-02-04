import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { UsersRound } from 'lucide-react';
import { GroupsList } from '../components/GroupsList/GroupsList';

export default function GroupsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('workspaces');

  if (!id) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <UsersRound className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('groups.title')}</h2>
      </div>
      <GroupsList workspaceId={id} />
    </div>
  );
}
