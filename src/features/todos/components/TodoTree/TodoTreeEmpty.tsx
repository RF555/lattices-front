import { LayoutList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TodoTreeEmptyProps {
  hasFilters: boolean;
}

export function TodoTreeEmpty({ hasFilters }: TodoTreeEmptyProps) {
  const { t } = useTranslation('todos');

  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-2">
        <LayoutList className="w-12 h-12 mx-auto" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-gray-900">
        {hasFilters ? t('empty.filteredTitle') : t('empty.defaultTitle')}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        {hasFilters ? t('empty.filteredMessage') : t('empty.defaultMessage')}
      </p>
    </div>
  );
}
