import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { LatticesLogo } from '@components/brand';
import { Button } from '@components/ui/Button';

interface WorkspaceEmptyStateProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceEmptyState({ onCreateWorkspace }: WorkspaceEmptyStateProps) {
  const { t } = useTranslation('workspaces');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <LatticesLogo size="md" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('emptyState.title')}</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md">{t('emptyState.description')}</p>
      <Button onClick={onCreateWorkspace}>
        <Plus className="h-4 w-4 mr-2" />
        {t('emptyState.createFirst')}
      </Button>
    </div>
  );
}
