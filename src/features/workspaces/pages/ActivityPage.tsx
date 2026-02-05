import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowLeft } from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed/ActivityFeed';

export default function ActivityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('workspaces');

  if (!id) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void navigate('/app');
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Activity className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('activity.title')}</h2>
      </div>
      <ActivityFeed workspaceId={id} />
    </div>
  );
}
