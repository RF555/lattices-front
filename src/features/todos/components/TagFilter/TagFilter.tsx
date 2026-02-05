import { useTranslation } from 'react-i18next';
import { useTags } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { TagBadge } from '@features/tags/components/TagBadge';
import { cn } from '@lib/utils/cn';

export function TagFilter() {
  const { t } = useTranslation('tags');
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: tags = [] } = useTags(activeWorkspaceId ?? undefined);
  const filterTagIds = useTodoUiStore((s) => s.filterTagIds);
  const setFilterTagIds = useTodoUiStore((s) => s.setFilterTagIds);

  const toggleTag = (tagId: string) => {
    const newIds = filterTagIds.includes(tagId)
      ? filterTagIds.filter((id) => id !== tagId)
      : [...filterTagIds, tagId];
    setFilterTagIds(newIds);
  };

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-x-visible">
      <span className="text-xs text-gray-500 shrink-0">{t('filter.label')}</span>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => {
            toggleTag(tag.id);
          }}
          className={cn(
            'rounded-full transition-opacity shrink-0',
            !filterTagIds.includes(tag.id) && 'opacity-50 hover:opacity-75',
          )}
        >
          <TagBadge tag={tag} />
        </button>
      ))}
      {filterTagIds.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setFilterTagIds([]);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
        >
          {t('filter.clear')}
        </button>
      )}
    </div>
  );
}
