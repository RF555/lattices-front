import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateTag } from '@features/tags/hooks/useTags';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Tooltip } from '@components/ui/Tooltip';
import { TAG_COLORS } from '@features/tags/types/tag';
import { cn } from '@lib/utils/cn';
import type { Tag } from '@features/tags/types/tag';

const COLOR_KEYS: Record<string, string> = {
  '#ef4444': 'red',
  '#f97316': 'orange',
  '#eab308': 'yellow',
  '#22c55e': 'green',
  '#14b8a6': 'teal',
  '#3b82f6': 'blue',
  '#8b5cf6': 'violet',
  '#ec4899': 'pink',
  '#6b7280': 'gray',
};

interface TagEditModalProps {
  tag: Tag;
  onClose: () => void;
}

export function TagEditModal({ tag, onClose }: TagEditModalProps) {
  const { t } = useTranslation('tags');
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.colorHex);

  const updateMutation = useUpdateTag();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id: tag.id,
        input: {
          name: name.trim(),
          colorHex: color,
        },
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{t('editModal.title')}</h2>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="tag-edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('editModal.nameLabel')}
            </label>
            <Input
              id="tag-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              required
            />
          </div>

          <div>
            <span
              id="tag-edit-color-label"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('editModal.colorLabel')}
            </span>
            <div className="flex gap-2" role="radiogroup" aria-labelledby="tag-edit-color-label">
              {TAG_COLORS.map((c) => (
                <Tooltip key={c} content={t(`colors.${COLOR_KEYS[c]}` as never)}>
                  <button
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-full',
                      color === c && 'ring-2 ring-offset-2 ring-gray-400',
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setColor(c);
                    }}
                  />
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              {t('editModal.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
